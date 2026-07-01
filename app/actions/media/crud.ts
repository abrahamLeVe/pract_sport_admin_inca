"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { handleMediaUpload } from "@/lib/upload";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/data/audit";
import z from "zod";
import { mediaSchema, MediaInput } from "@/validations/media";
import { deleteFileFromS3Action } from "../storage";
import sharp from "sharp";

export async function addMediaAction(
  prevState: ActionState<MediaInput>,
  formData: FormData,
): Promise<ActionState<MediaInput>> {
  const session = await requireAdminSession();
  const file = formData.get("media_file") as File | null;
  const source_type = formData.get("source_type") as "file" | "url";

  // 1. METADATOS (Sharp) - Calculado antes de construir 'fields'
  let width = null;
  let height = null;
  if (file && file.type.startsWith("image/")) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const metadata = await sharp(buffer).metadata();
      width = metadata.width || null;
      height = metadata.height || null;
    } catch (e) {
      console.error("❌ Error obteniendo dimensiones:", e);
    }
  }

  // 2. CONSTRUCCIÓN DE CAMPOS (Uniformidad)
  const fields = {
    media_type: (formData.get("media_type") as any) || "image",
    media_url:
      source_type === "url"
        ? formData.get("media_url")?.toString() || ""
        : "pending",
    media_key: formData.get("media_key")?.toString() || null,
    file_name: file?.name || null,
    file_format: file?.type || null,
    size_bytes: file?.size || 0,
    width: width,
    height: height,
    alt_text: formData.get("alt_text")?.toString() || "",
    folder_name: formData.get("folder_name")?.toString() || "general",
  };

  try {
    // 3. VALIDACIÓN
    const validatedFields = mediaSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    // 4. LÓGICA DE SUBIDA S3
    let finalUrl = validatedFields.data.media_url;
    let finalKey = validatedFields.data.media_key;

    if (source_type === "file") {
      const upload = await handleMediaUpload(
        formData,
        "media_file",
        "media",
        validatedFields.data.media_type,
        true,
      );
      if (!upload.success)
        return {
          success: false,
          message: upload.message || "Error al subir a S3",
          data: fields,
        };
      finalUrl = upload.url!;
      finalKey = upload.key;
    }

    // 5. DESTRUCTURACIÓN (Uniformidad - Esto hace que el SQL se vea limpio)
    const {
      media_type,
      alt_text,
      folder_name,
      file_name,
      file_format,
      size_bytes,
      width: finalWidth,
      height: finalHeight,
    } = validatedFields.data;

    // 6. TRANSACCIÓN SQL
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const mediaQuery = `
        INSERT INTO media (
          media_type, media_url, media_key, file_name, file_format, 
          size_bytes, width, height, alt_text, folder_name
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `;

      const mediaResult = await client.query(mediaQuery, [
        media_type,
        finalUrl,
        finalKey,
        file_name,
        file_format,
        size_bytes,
        finalWidth,
        finalHeight,
        alt_text,
        folder_name,
      ]);

      const newMediaId = mediaResult.rows[0].id;

      // 7. ASOCIACIÓN (Si aplica)
      const model_type = formData.get("model_type")?.toString();
      const model_id = formData.get("model_id");

      if (model_type && model_id) {
        await client.query(
          `INSERT INTO media_links (media_id, model_type, model_id, display_order) VALUES ($1, $2, $3, $4)`,
          [
            newMediaId,
            model_type,
            Number(model_id),
            Number(formData.get("display_order") || 0),
          ],
        );
        revalidatePath(`/dashboard/${model_type}s/edit/${model_id}`);
      }

      await client.query("COMMIT");

      // 8. AUDITORÍA
      await logAudit(
        session.user.id,
        "CREATE",
        "media",
        newMediaId,
        null,
        validatedFields.data,
      );

      return { success: true, message: "Medio agregado exitosamente." };
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error en addMediaAction:", error.message);
    return {
      success: false,
      message: "Error interno del servidor.",
      data: fields,
    };
  }
}

// 1. MOVER A LA PAPELERA (Soft Delete de la Media)
export async function deleteMediaAction(
  id: number,
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  try {
    await pool.query(
      "UPDATE media SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    await logAudit(session.user.id, "SOFT_DELETE", "media", id);

    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Archivo movido a la papelera." };
  } catch (error: any) {
    console.error("❌ Error en deleteMediaAction:", error.message);
    return { success: false, message: "Error al mover a la papelera." };
  }
}

// 2. ELIMINAR DEFINITIVAMENTE (Hard Delete)
export async function permanentlyDeleteMediaAction(
  id: number,
  modelType?: string,
  modelId?: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  try {
    // Obtenemos el key para limpiar S3
    const { rows } = await pool.query(
      "SELECT media_key FROM media WHERE id = $1",
      [id],
    );

    if (rows[0]?.media_key) {
      await deleteFileFromS3Action(rows[0].media_key);
    }

    // Al borrar de 'media', el ON DELETE CASCADE borrará automáticamente el registro en 'media_links'
    await pool.query("DELETE FROM media WHERE id = $1", [id]);

    await logAudit(session.user.id, "HARD_DELETE", "media", id);

    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Archivo eliminado permanentemente." };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteMediaAction:", error.message);
    return { success: false, message: "Error al eliminar permanentemente." };
  }
}

// 3. BULK SOFT DELETE
export async function bulkDeleteMediaAction(
  ids: number[],
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    await pool.query("UPDATE media SET deleted_at = NOW() WHERE id = ANY($1)", [
      ids,
    ]);

    await logAudit(session.user.id, "BULK_SOFT_DELETE", "media", ids.join(","));

    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return {
      success: true,
      message: `${ids.length} archivos movidos a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteMediaAction:", error.message);
    return { success: false, message: "Error al procesar la solicitud." };
  }
}

// 4. BULK HARD DELETE
export async function bulkPermanentlyDeleteMediaAction(
  ids: number[],
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    // Limpieza S3
    const { rows } = await pool.query(
      "SELECT media_key FROM media WHERE id = ANY($1) AND media_key IS NOT NULL",
      [ids],
    );
    for (const row of rows) await deleteFileFromS3Action(row.media_key);

    // Borrado SQL (El CASCADE hace el resto)
    await pool.query("DELETE FROM media WHERE id = ANY($1)", [ids]);

    await logAudit(session.user.id, "BULK_HARD_DELETE", "media", ids.join(","));

    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Elementos purgados correctamente." };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteMediaAction:",
      error.message,
    );
    return { success: false, message: "Error al purgar los elementos." };
  }
}

export async function updateMediaOrderAction(
  updates: { id: number; display_order: number }[], // Aquí 'id' es el link_id (PK de media_links)
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession();

  if (!updates || updates.length === 0)
    return { success: false, message: "No hay elementos." };

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    // 🔥 Query directo por el ID de la tabla media_links (PK)
    const updateQuery = `UPDATE media_links SET display_order = $1 WHERE id = $2`;

    for (const item of updates) {
      await client.query(updateQuery, [item.display_order, item.id]);
    }

    await client.query("COMMIT");
    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Orden actualizado." };
  } catch (error: any) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error en updateMediaOrderAction:", error.message);
    return { success: false, message: "Error al guardar el nuevo orden." };
  } finally {
    if (client) client.release();
  }
}

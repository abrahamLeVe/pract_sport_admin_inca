import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { handleMediaUpload } from "@/lib/upload";
import { ActionState } from "@/validations/core";
import { EventMediaInput, eventMediaSchema } from "@/validations/events";
import { revalidatePath } from "next/cache";
import { deleteFileFromS3Action } from "../storage";
import { logAudit } from "@/lib/data/audit";
import z from "zod";

export async function addEventMediaAction(
  prevState: ActionState<EventMediaInput>,
  formData: FormData,
): Promise<ActionState<EventMediaInput>> {
  const session = await requireAdminSession();

  const fields = {
    event_id: Number(formData.get("event_id")),
    media_type: formData.get("media_type") as "image" | "video" | "merch",
    media_url: formData.get("media_url")?.toString() || "",
    alt_text: formData.get("alt_text")?.toString() || "",
    display_order: Number(formData.get("display_order") || 0),
  };

  try {
    // 1. Validaciones previas (Zod)
    const validatedFields = eventMediaSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    // 2. Lógica de subida a S3 (si hay archivo)
    let finalUrl = validatedFields.data.media_url;
    let finalKey = null;

    // Usamos el mismo handleImageUpload, asegurándonos que el formulario mande el campo "media_file"
    if (fields.media_type === "image" || fields.media_type === "video") {
      const imageResult = await handleMediaUpload(
        formData,
        "media_file",
        "events/media",
        fields.media_type,
      );

      // Si la subida fue exitosa (y hubo archivo), sobreescribimos la URL
      if (imageResult.success && imageResult.url) {
        finalUrl = imageResult.url;
        finalKey = imageResult.key;
      }
    }
    // 3. Inserción en DB
    const query = `
      INSERT INTO event_media (event_id, media_type, media_url, media_key, alt_text, display_order) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id
    `;
    const result = await pool.query(query, [
      validatedFields.data.event_id,
      validatedFields.data.media_type,
      finalUrl,
      finalKey,
      validatedFields.data.alt_text || null,
      validatedFields.data.display_order,
    ]);

    // 4. Auditoría uniforme
    await logAudit(
      session.user.id,
      "CREATE",
      "event_media",
      result.rows[0].id,
      null,
      { ...validatedFields.data, media_url: finalUrl },
    );

    revalidatePath(`/dashboard/events/edit/${validatedFields.data.event_id}`);
    return { success: true, message: "Medio agregado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en addEventMediaAction:", error.message);
    return {
      success: false,
      message: "Error al guardar el medio.",
      data: fields,
    };
  }
}

// 1. MOVER A LA PAPELERA (Soft Delete)
export async function deleteEventMediaAction(
  id: number,
  event_id: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  try {
    await pool.query(
      "UPDATE event_media SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    // 📋 AUDITORÍA UNIFORME
    await logAudit(session.user.id, "SOFT_DELETE", "event_media", id);

    revalidatePath(`/dashboard/events/edit/${event_id}`);
    return { success: true, message: "Archivo movido a la papelera." };
  } catch (error: any) {
    console.error("❌ Error en deleteEventMediaAction:", error.message);
    return {
      success: false,
      message: "Error al mover el archivo a la papelera.",
    };
  }
}

// 2. ELIMINAR DEFINITIVAMENTE (Hard Delete)
export async function permanentlyDeleteEventMediaAction(
  id: number,
  event_id: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  try {
    const { rows } = await pool.query(
      "SELECT media_key FROM event_media WHERE id = $1",
      [id],
    );
    if (rows[0]?.media_key) await deleteFileFromS3Action(rows[0].media_key);

    await pool.query("DELETE FROM event_media WHERE id = $1", [id]);

    // 📋 AUDITORÍA UNIFORME
    await logAudit(session.user.id, "HARD_DELETE", "event_media", id);

    revalidatePath(`/dashboard/events/edit/${event_id}`);
    return { success: true, message: "Archivo eliminado permanentemente." };
  } catch (error: any) {
    console.error(
      "❌ Error en permanentlyDeleteEventMediaAction:",
      error.message,
    );
    return { success: false, message: "Error al eliminar el archivo." };
  }
}

// 3. BULK SOFT DELETE
export async function bulkDeleteEventMediaAction(
  ids: number[],
  event_id: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  if (!ids || ids.length === 0)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    await pool.query(
      "UPDATE event_media SET deleted_at = NOW() WHERE id = ANY($1)",
      [ids],
    );

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "event_media",
      ids.join(","),
    );

    revalidatePath(`/dashboard/events/edit/${event_id}`);
    return {
      success: true,
      message: `${ids.length} archivos movidos a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteEventMediaAction:", error.message);
    return { success: false, message: "Error al eliminar los elementos." };
  }
}

// 4. BULK HARD DELETE
export async function bulkPermanentlyDeleteEventMediaAction(
  ids: number[],
  event_id: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  if (!ids || ids.length === 0)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    const { rows } = await pool.query(
      "SELECT media_key FROM event_media WHERE id = ANY($1) AND media_key IS NOT NULL",
      [ids],
    );

    for (const row of rows) {
      await deleteFileFromS3Action(row.media_key);
    }

    await pool.query("DELETE FROM event_media WHERE id = ANY($1)", [ids]);

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "event_media",
      ids.join(","),
    );

    revalidatePath(`/dashboard/events/edit/${event_id}`);
    return { success: true, message: "Elementos eliminados permanentemente." };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteEventMediaAction:",
      error.message,
    );
    return { success: false, message: "Error al purgar los elementos." };
  }
}

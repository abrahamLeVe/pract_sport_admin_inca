"use server";
import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { deleteFileFromS3Action } from "../storage";
import { logAudit } from "@/lib/data/audit";
import { revalidatePath } from "next/cache";

// 2. ELIMINAR DEFINITIVAMENTE (Hard Delete)
export async function permanentlyDeleteMediaAction(
  linkId: number, // 🔥 Ahora sabemos que este es el ID de media_links
  modelType?: string,
  modelId?: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  try {
    // 🔥 1. Buscamos el archivo en 'media' a través de su 'media_links'
    const { rows } = await pool.query(
      `SELECT m.id AS media_id, m.media_key 
       FROM media m
       JOIN media_links ml ON m.id = ml.media_id
       WHERE ml.id = $1`,
      [linkId],
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: "El archivo no existe o ya fue eliminado.",
      };
    }

    const { media_id, media_key } = rows[0];

    // 🔥 2. Borramos físicamente de AWS S3
    if (media_key) {
      await deleteFileFromS3Action(media_key);
    }

    // 🔥 3. Borramos de la tabla 'media' usando su verdadero ID
    // (Gracias a tu ON DELETE CASCADE, esto borrará también el 'media_links' automáticamente)
    await pool.query("DELETE FROM media WHERE id = $1", [media_id]);

    await logAudit(session.user.id, "HARD_DELETE", "media", media_id);

    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Archivo eliminado permanentemente." };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteMediaAction:", error.message);
    return { success: false, message: "Error al eliminar permanentemente." };
  }
}

// 3. BULK SOFT DELETE
export async function bulkDeleteMediaAction(
  ids: number[], // Estos son los IDs de media_links
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    // 🔥 Subconsulta: Actualizamos 'media' buscando los media_id que corresponden a estos links
    await pool.query(
      `UPDATE media 
       SET deleted_at = NOW() 
       WHERE id IN (
         SELECT media_id FROM media_links WHERE id = ANY($1)
       )`,
      [ids],
    );

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
  ids: number[], // Estos son los IDs de media_links
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    // 🔥 1. Obtenemos los verdaderos media_id y media_key a través de un JOIN masivo
    const { rows } = await pool.query(
      `SELECT m.id AS media_id, m.media_key 
       FROM media m
       JOIN media_links ml ON m.id = ml.media_id
       WHERE ml.id = ANY($1)`,
      [ids],
    );

    if (rows.length === 0) {
      return { success: false, message: "Los archivos ya no existen." };
    }

    // Extraemos un arreglo solo con los verdaderos IDs de la tabla media
    const trueMediaIds = rows.map((row) => row.media_id);

    // 🔥 2. Limpieza de S3
    for (const row of rows) {
      if (row.media_key) {
        await deleteFileFromS3Action(row.media_key);
      }
    }

    // 🔥 3. Borrado SQL usando los IDs reales (El ON DELETE CASCADE limpiará los links)
    await pool.query("DELETE FROM media WHERE id = ANY($1)", [trueMediaIds]);

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

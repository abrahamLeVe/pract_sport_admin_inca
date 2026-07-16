"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";

export async function associateMediaAction(
  mediaId: number,
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  const session = await requireAdminSession(); // 🔥 Guardamos la sesión
  try {
    // 🔥 Añadimos RETURNING id
    const result = await pool.query(
      `INSERT INTO media_links (media_id, model_type, model_id) VALUES ($1, $2, $3) RETURNING id`,
      [mediaId, modelType, modelId],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "CREATE",
      "media_links",
      result.rows[0].id,
      null, // 🔥 old_data: null
      { media_id: mediaId, model_type: modelType, model_id: modelId }, // 🔥 new_data: qué se enlazó con qué
    );

    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Imagen asociada correctamente." };
  } catch (error) {
    return { success: false, message: "Error al asociar el medio." };
  }
}

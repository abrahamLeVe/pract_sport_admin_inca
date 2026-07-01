"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";

export async function associateMediaAction(
  mediaId: number,
  modelType: string,
  modelId: number,
): Promise<ActionState> {
  requireAdminSession();
  try {
    await pool.query(
      `INSERT INTO media_links (media_id, model_type, model_id) VALUES ($1, $2, $3)`,
      [mediaId, modelType, modelId],
    );
    revalidatePath(`/dashboard/${modelType}s/edit/${modelId}`);
    return { success: true, message: "Imagen asociada correctamente." };
  } catch (error) {
    return { success: false, message: "Error al asociar el medio." };
  }
}

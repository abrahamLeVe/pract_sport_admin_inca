"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { deleteFileFromS3Action } from "../storage";

const TRASH_ROUTE = "/dashboard/banners/trash";

// 🟢 RESTAURAR
export async function restoreBannerAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  try {
    await pool.query("UPDATE banners SET deleted_at = NULL WHERE id = $1", [
      id,
    ]);
    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "RESTORE",
      "banners",
      id,
      { deleted_at: "timestamp" }, // 🔥 old_data: simulamos que tenía fecha
      { deleted_at: null }, // 🔥 new_data: volvió a estar activo (null)
    );

    revalidatePath("/dashboard/banners");
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Banner restaurado correctamente." };
  } catch (error: any) {
    return { success: false, message: "Error al restaurar el banner." };
  }
}

// 🔴 ELIMINAR DEFINITIVAMENTE
export async function permanentlyDeleteBannerAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      "SELECT image_key FROM banners WHERE id = $1",
      [id],
    );

    if (rows.length === 0) {
      return { success: false, message: "El banner no existe." };
    }

    const oldData = rows[0]; // 📸 Foto de cómo era el banner
    const imageKey = oldData.image_key; // Extraemos la llave para AWS S3

    await client.query("BEGIN");

    if (imageKey) {
      await deleteFileFromS3Action(imageKey);
    }

    await client.query("DELETE FROM banners WHERE id = $1", [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "HARD_DELETE",
      "banners",
      id,
      oldData, // 🔥 old_data: Toda la información del banner destruido
      null, // 🔥 new_data: null (ya no existe)
    );

    await client.query("COMMIT");

    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Banner eliminado permanentemente." };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error en permanentlyDeleteBannerAction:", error);
    return { success: false, message: "No se pudo purgar el banner." };
  } finally {
    client.release();
  }
}
// 🔵 BULK RESTORE
export async function bulkRestoreBannersAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length) return { success: false, message: "No hay elementos." };

  try {
    await pool.query(
      "UPDATE banners SET deleted_at = NULL WHERE id = ANY($1)",
      [ids],
    );
    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_RESTORE",
      "banners",
      ids.join(","),
      { deleted_at: "timestamp" }, // 🔥 old_data
      { deleted_at: null }, // 🔥 new_data
    );

    revalidatePath("/dashboard/banners");
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: `${ids.length} banners restaurados.` };
  } catch (error) {
    return { success: false, message: "Error al restaurar." };
  }
}

// 🔴 BULK HARD DELETE
export async function bulkPermanentlyDeleteBannersAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      "SELECT image_key FROM banners WHERE id = ANY($1)",
      [ids],
    );
    const oldDataArray = rows;
    await client.query("BEGIN");

    for (const row of rows) {
      if (row.image_key) await deleteFileFromS3Action(row.image_key);
    }

    // 3. Borrado físico masivo
    await client.query("DELETE FROM banners WHERE id = ANY($1)", [ids]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "banners",
      ids.join(","),
      oldDataArray, // 🔥 old_data: Array con todos los objetos completos
      null, // 🔥 new_data: null
    );

    await client.query("COMMIT");

    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Banners eliminados permanentemente." };
  } catch (error: any) {
    await client.query("ROLLBACK"); // Revertimos si algo falla
    console.error(
      "❌ Error en bulkPermanentlyDeleteBannersAction:",
      error.message,
    );
    return { success: false, message: "Error al purgar los banners." };
  } finally {
    client.release();
  }
}

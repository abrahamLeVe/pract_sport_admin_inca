"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { deleteFileFromS3Action } from "../storage";

const TRASH_ROUTE = "/dashboard/categories/trash";

// ============================================================================
// 1. RESTAURACIÓN (Individual y Masiva)
// ============================================================================

export async function restoreCategoryAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  try {
    await pool.query("UPDATE categories SET deleted_at = NULL WHERE id = $1", [
      id,
    ]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "RESTORE",
      "categories",
      id,
      { deleted_at: "timestamp" }, // 🔥 old_data
      { deleted_at: null }, // 🔥 new_data
    );

    revalidatePath("/dashboard/categories");
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Categoría restaurada correctamente." };
  } catch (error) {
    return { success: false, message: "Error al restaurar la categoría." };
  }
}

export async function bulkRestoreCategoriesAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay categorías seleccionadas." };

  try {
    await pool.query(
      "UPDATE categories SET deleted_at = NULL WHERE id = ANY($1)",
      [ids],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_RESTORE",
      "categories",
      ids.join(","),
      { deleted_at: "timestamp" }, // 🔥 old_data
      { deleted_at: null }, // 🔥 new_data
    );

    revalidatePath("/dashboard/categories");
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: `${ids.length} categorías restauradas.` };
  } catch (error) {
    return { success: false, message: "Error al restaurar las categorías." };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteCategoryAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  const client = await pool.connect();
  try {
    // 🔥 PASO 1: SELECT * para capturar toda la evidencia antes de borrar
    const { rows } = await client.query(
      "SELECT * FROM categories WHERE id = $1",
      [id],
    );
    if (rows.length === 0)
      return { success: false, message: "La categoría no existe." };

    const oldData = rows[0]; // 📸 Foto de cómo era la categoría
    const { image_key } = oldData;

    await client.query("BEGIN"); // Inicio de transacción

    // 1. Desasociamos los productos (evita violación de Foreign Key)
    await client.query(
      "UPDATE products SET category_id = NULL WHERE category_id = $1",
      [id],
    );

    // 2. Borramos imagen de S3
    if (image_key) await deleteFileFromS3Action(image_key);

    // 3. Borramos el registro
    await client.query("DELETE FROM categories WHERE id = $1", [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "HARD_DELETE",
      "categories",
      id,
      oldData, // 🔥 old_data: Toda la información de la categoría destruida
      null, // 🔥 new_data: null (ya no existe)
    );

    await client.query("COMMIT"); // Confirmar
    revalidatePath(TRASH_ROUTE);
    return {
      success: true,
      message: "Categoría eliminada permanentemente y productos desvinculados.",
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error en permanentlyDeleteCategoryAction:", error);
    return { success: false, message: "Error al purgar la categoría." };
  } finally {
    client.release();
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR A PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteCategoriesAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay categorías seleccionadas." };

  try {
    await pool.query(
      "UPDATE categories SET deleted_at = NOW() WHERE id = ANY($1)",
      [ids],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "categories",
      ids.join(","),
      { deleted_at: null }, // 🔥 old_data
      { deleted_at: new Date().toISOString() }, // 🔥 new_data
    );

    revalidatePath("/dashboard/categories");
    revalidatePath(TRASH_ROUTE);
    return {
      success: true,
      message: `${ids.length} categorías movidas a la papelera.`,
    };
  } catch (error: any) {
    return { success: false, message: "Error al enviar a papelera." };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteCategoriesAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay categorías seleccionadas." };

  const client = await pool.connect();
  try {
    // 🔥 PASO 1: SELECT * para capturar todas las categorías completas
    const { rows } = await client.query(
      "SELECT * FROM categories WHERE id = ANY($1)",
      [ids],
    );
    const oldDataArray = rows; // 📸 Foto grupal de las categorías a borrar

    await client.query("BEGIN"); // Inicio de transacción

    // 1. Desasociamos todos los productos en bloque
    await client.query(
      "UPDATE products SET category_id = NULL WHERE category_id = ANY($1)",
      [ids],
    );

    // 2. Limpieza S3 masiva
    for (const row of rows) {
      if (row.image_key) await deleteFileFromS3Action(row.image_key);
    }

    // 3. Borrado masivo
    await client.query("DELETE FROM categories WHERE id = ANY($1)", [ids]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "categories",
      ids.join(","),
      oldDataArray, // 🔥 old_data: Array con todas las categorías
      null, // 🔥 new_data: null
    );

    await client.query("COMMIT"); // Confirmar
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Categorías eliminadas permanentemente." };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error en bulkPermanentlyDeleteCategoriesAction:", error);
    return { success: false, message: "Error al purgar las categorías." };
  } finally {
    client.release();
  }
}

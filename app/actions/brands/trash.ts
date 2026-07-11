"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { deleteFileFromS3Action } from "../storage";

const TRASH_ROUTE = "/dashboard/brands/trash";

// ============================================================================
// 1. RESTAURACIÓN (Individual y Masiva)
// ============================================================================

export async function restoreBrandAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  try {
    await pool.query("UPDATE brands SET deleted_at = NULL WHERE id = $1", [id]);
    await logAudit(session.user.id, "RESTORE", "brands", id);

    revalidatePath("/dashboard/brands");
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Marca restaurada correctamente." };
  } catch (error) {
    return { success: false, message: "Error al restaurar la marca." };
  }
}

export async function bulkRestoreBrandsAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay marcas seleccionadas." };

  try {
    await pool.query("UPDATE brands SET deleted_at = NULL WHERE id = ANY($1)", [
      ids,
    ]);
    await logAudit(session.user.id, "BULK_RESTORE", "brands", ids.join(","));

    revalidatePath("/dashboard/brands");
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: `${ids.length} marcas restauradas.` };
  } catch (error) {
    return { success: false, message: "Error al restaurar las marcas." };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteBrandAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  const client = await pool.connect();

  try {
    // 1. Buscamos la marca y sus productos asociados
    const { rows: brandRows } = await client.query(
      "SELECT image_key FROM brands WHERE id = $1",
      [id],
    );
    if (brandRows.length === 0)
      return { success: false, message: "La marca no existe." };

    await client.query("BEGIN"); // Iniciamos transacción

    // 2. Desasociamos todos los productos (IMPORTANTE: Evita el error de RESTRICT)
    await client.query(
      "UPDATE products SET brand_id = NULL WHERE brand_id = $1",
      [id],
    );

    // 3. Borramos el logo de S3
    const { image_key } = brandRows[0];
    if (image_key) await deleteFileFromS3Action(image_key);

    // 4. Borramos la marca
    await client.query("DELETE FROM brands WHERE id = $1", [id]);

    await logAudit(session.user.id, "HARD_DELETE", "brands", id);

    await client.query("COMMIT"); // Todo salió bien
    revalidatePath("/dashboard/brands/trash");
    return {
      success: true,
      message: "Marca eliminada y productos desvinculados.",
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error al purgar marca:", error);
    return {
      success: false,
      message: "No se pudo purgar la marca. Revisa los permisos.",
    };
  } finally {
    client.release();
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR A PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteBrandsAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay marcas seleccionadas." };

  try {
    await pool.query(
      "UPDATE brands SET deleted_at = NOW() WHERE id = ANY($1)",
      [ids],
    );
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "brands",
      ids.join(","),
    );

    revalidatePath("/dashboard/brands");
    revalidatePath(TRASH_ROUTE);
    return {
      success: true,
      message: `${ids.length} marcas movidas a la papelera.`,
    };
  } catch (error) {
    return { success: false, message: "Error al enviar a papelera." };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteBrandsAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay marcas seleccionadas." };

  const client = await pool.connect();
  try {
    // 1. Obtenemos las imágenes antes de borrar
    const { rows } = await client.query(
      "SELECT image_key FROM brands WHERE id = ANY($1)",
      [ids],
    );

    await client.query("BEGIN"); // Transacción inicio

    // 2. Desasociamos todos los productos de estas marcas
    // Esto evita el error de violación de Foreign Key (RESTRICT)
    await client.query(
      "UPDATE products SET brand_id = NULL WHERE brand_id = ANY($1)",
      [ids],
    );

    // 3. Limpieza S3 masiva
    for (const row of rows) {
      if (row.image_key) await deleteFileFromS3Action(row.image_key);
    }

    // 4. Remoción final de los registros de marcas
    await client.query("DELETE FROM brands WHERE id = ANY($1)", [ids]);

    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "brands",
      ids.join(","),
    );

    await client.query("COMMIT"); // Transacción confirmada
    revalidatePath(TRASH_ROUTE);
    return {
      success: true,
      message: "Marcas y sus asociaciones eliminadas correctamente.",
    };
  } catch (error: any) {
    await client.query("ROLLBACK"); // Revertimos todo si algo falla
    console.error("❌ Error en bulkPermanentlyDeleteBrandsAction:", error);
    return { success: false, message: "Error al purgar las marcas." };
  } finally {
    client.release();
  }
}

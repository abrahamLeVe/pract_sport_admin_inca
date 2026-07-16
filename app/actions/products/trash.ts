"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { logAudit } from "@/lib/data/audit";
import { deleteFileFromS3Action } from "../storage";
import { ActionState } from "@/validations/core";

const REVALIDATE_ROUTE = "/dashboard/products";
const TRASH_ROUTE = "/dashboard/products/trash";

// 🟢 RESTAURAR: Mueve de papelera a activo (Soft Delete -> null)
export async function restoreProductAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Restaurar el producto
    await client.query("UPDATE products SET deleted_at = NULL WHERE id = $1", [
      id,
    ]);

    // 2. Restaurar TODAS las variantes asociadas
    await client.query(
      "UPDATE product_variants SET deleted_at = NULL WHERE product_id = $1",
      [id],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "RESTORE",
      "products",
      id,
      { deleted_at: "timestamp" }, // 🔥 old_data
      { deleted_at: null }, // 🔥 new_data
    );

    await client.query("COMMIT");

    revalidatePath("/dashboard/products");
    revalidatePath("/dashboard/products/trash");

    return {
      success: true,
      message: "Producto y sus variantes restaurados correctamente.",
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error en restoreProductAction:", error.message);
    return { success: false, message: "Error al restaurar el producto." };
  } finally {
    client.release();
  }
}

// 🔵 BULK RESTORE
export async function bulkRestoreProductsAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      "UPDATE products SET deleted_at = NULL WHERE id = ANY($1)",
      [ids],
    );

    await client.query(
      "UPDATE product_variants SET deleted_at = NULL WHERE product_id = ANY($1)",
      [ids],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_RESTORE",
      "products",
      ids.join(","),
      { deleted_at: "timestamp" }, // 🔥 old_data
      { deleted_at: null }, // 🔥 new_data
    );

    await client.query("COMMIT");

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(TRASH_ROUTE);
    return {
      success: true,
      message: `${ids.length} productos y sus variantes restaurados.`,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    return { success: false, message: "Error al restaurar los productos." };
  } finally {
    client.release();
  }
}

// 🟡 NUEVO: BULK SOFT DELETE (Enviar seleccionados a la papelera)
export async function bulkDeleteProductsAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Enviar productos a papelera
    await client.query(
      "UPDATE products SET deleted_at = NOW() WHERE id = ANY($1)",
      [ids],
    );

    // 2. Enviar variantes a papelera
    await client.query(
      "UPDATE product_variants SET deleted_at = NOW() WHERE product_id = ANY($1)",
      [ids],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "products",
      ids.join(","),
      { deleted_at: null }, // 🔥 old_data
      { deleted_at: new Date().toISOString() }, // 🔥 new_data
    );

    await client.query("COMMIT");

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `${ids.length} productos enviados a la papelera.`,
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error en bulkDeleteProductsAction:", error.message);
    return { success: false, message: "Error al enviar a la papelera." };
  } finally {
    client.release();
  }
}

// 🔴 ELIMINAR DEFINITIVAMENTE (Actualizado a la nueva DB Polimórfica)
export async function permanentlyDeleteProductAction(
  id: number,
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 🔥 Candado de seguridad: Evitar borrar productos comprados
    const orderCheck = await client.query(
      "SELECT COUNT(*) FROM order_items WHERE product_id = $1",
      [id],
    );
    if (parseInt(orderCheck.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message: "No se puede purgar. Ya existen pedidos con este producto.",
      };
    }

    const { rows } = await client.query(
      "SELECT * FROM products WHERE id = $1",
      [id],
    );
    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return { success: false, message: "El producto no existe." };
    }

    const oldData = rows[0]; // 📸 Foto de cómo era el producto
    const mainImageKey = oldData?.image_key;

    // Obtener e iterar la galería vinculada
    const mediaList = await client.query(
      "SELECT media_id FROM media_links WHERE model_type = 'product' AND model_id = $1",
      [id],
    );
    await client.query(
      "DELETE FROM media_links WHERE model_type = 'product' AND model_id = $1",
      [id],
    );

    for (const row of mediaList.rows) {
      const checkLinks = await client.query(
        "SELECT COUNT(*) FROM media_links WHERE media_id = $1",
        [row.media_id],
      );
      if (parseInt(checkLinks.rows[0].count) === 0) {
        const mediaFile = await client.query(
          "SELECT media_key FROM media WHERE id = $1",
          [row.media_id],
        );
        if (mediaFile.rows[0]?.media_key)
          await deleteFileFromS3Action(mediaFile.rows[0].media_key);
        await client.query("DELETE FROM media WHERE id = $1", [row.media_id]);
      }
    }

    // Borrar portada
    if (mainImageKey) await deleteFileFromS3Action(mainImageKey);

    // Borrar DB
    await client.query("DELETE FROM product_variants WHERE product_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM products WHERE id = $1", [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "HARD_DELETE",
      "products",
      id,
      oldData, // 🔥 old_data: Toda la información del producto destruido
      null, // 🔥 new_data: null (ya no existe)
    );
    await client.query("COMMIT");

    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Producto eliminado permanentemente." };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error en permanentlyDeleteProductAction:", error.message);
    return { success: false, message: "No se pudo purgar el producto." };
  } finally {
    client.release();
  }
}

// 🔴 BULK HARD DELETE (Actualizado a la nueva DB Polimórfica)
export async function bulkPermanentlyDeleteProductsAction(
  ids: number[],
): Promise<ActionState<any>> {
  const session = await requireAdminSession();
  if (!ids?.length)
    return { success: false, message: "No hay elementos seleccionados." };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 🔥 Candado de seguridad masivo
    const orderCheck = await client.query(
      "SELECT COUNT(*) FROM order_items WHERE product_id = ANY($1)",
      [ids],
    );
    if (parseInt(orderCheck.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message:
          "No se pueden purgar. Algunos productos seleccionados ya tienen pedidos.",
      };
    }

    // 🔥 1. Obtener todos los datos de los productos a borrar
    const productsList = await client.query(
      "SELECT * FROM products WHERE id = ANY($1)",
      [ids],
    );
    const oldDataArray = productsList.rows; // 📸 Foto grupal

    // 2. Galería Polimórfica
    const mediaList = await client.query(
      "SELECT DISTINCT media_id FROM media_links WHERE model_type = 'product' AND model_id = ANY($1)",
      [ids],
    );
    await client.query(
      "DELETE FROM media_links WHERE model_type = 'product' AND model_id = ANY($1)",
      [ids],
    );

    for (const row of mediaList.rows) {
      const check = await client.query(
        "SELECT COUNT(*) FROM media_links WHERE media_id = $1",
        [row.media_id],
      );
      if (parseInt(check.rows[0].count) === 0) {
        const mediaFile = await client.query(
          "SELECT media_key FROM media WHERE id = $1",
          [row.media_id],
        );
        if (mediaFile.rows[0]?.media_key)
          await deleteFileFromS3Action(mediaFile.rows[0].media_key);
        await client.query("DELETE FROM media WHERE id = $1", [row.media_id]);
      }
    }

    // 3. Borrar imágenes S3 (Portadas)
    for (const row of productsList.rows) {
      if (row.image_key) await deleteFileFromS3Action(row.image_key);
    }

    // 4. Borrar de la BD
    await client.query(
      "DELETE FROM product_variants WHERE product_id = ANY($1)",
      [ids],
    );
    await client.query("DELETE FROM products WHERE id = ANY($1)", [ids]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "products",
      ids.join(","),
      oldDataArray, // 🔥 old_data: Array con todos los productos
      null, // 🔥 new_data: null
    );
    await client.query("COMMIT");

    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Elementos eliminados permanentemente." };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(
      "❌ Error en bulkPermanentlyDeleteProductsAction:",
      error.message,
    );
    return { success: false, message: "Error al purgar los elementos." };
  } finally {
    client.release();
  }
}

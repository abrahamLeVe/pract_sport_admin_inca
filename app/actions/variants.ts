"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  EditVariantInput,
  editVariantSchema,
  VariantInput,
  variantSchema,
} from "@/validations/variants";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function createVariantAction(
  prevState: ActionState<VariantInput>,
  formData: FormData,
): Promise<ActionState<VariantInput>> {
  const session = await requireAdminSession();

  const rawSizeId = formData.get("size_id")?.toString();
  const rawColorId = formData.get("color_id")?.toString();

  const fields = {
    product_id: Number(formData.get("product_id")),
    size_id: rawSizeId ? Number(rawSizeId) : null,
    color_id: rawColorId ? Number(rawColorId) : null,
    sku: formData.get("sku")?.toString() || "",
    stock: Number(formData.get("stock") || "0"),
    track_stock: formData.get("track_stock")?.toString() !== "false",
    status: (formData.get("status")?.toString() || "activo") as
      | "activo"
      | "inactivo",
  };

  try {
    const validatedFields = variantSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { product_id, size_id, color_id, sku, stock, status, track_stock } =
      validatedFields.data;

    const duplicateCheck = await pool.query(
      `SELECT id FROM product_variants 
       WHERE product_id = $1 
         AND COALESCE(size_id, 0) = COALESCE($2, 0) 
         AND COALESCE(color_id, 0) = COALESCE($3, 0)
         AND deleted_at IS NULL`,
      [product_id, size_id || null, color_id || null],
    );

    if ((duplicateCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Ya existe una variante con esta Talla y Color.",
        zodErrors: {
          size_id: ["Combinación duplicada"],
          color_id: ["Combinación duplicada"],
        },
        data: fields,
      };
    }

    if (sku) {
      const skuCheck = await pool.query(
        "SELECT id FROM product_variants WHERE sku = $1 AND deleted_at IS NULL",
        [sku],
      );
      if ((skuCheck.rowCount ?? 0) > 0) {
        return {
          success: false,
          message: "Este SKU ya está registrado.",
          zodErrors: { sku: ["SKU duplicado"] },
          data: fields,
        };
      }
    }

    const query = `
      INSERT INTO product_variants (product_id, size_id, color_id, sku, stock, status, track_stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const result = await pool.query(query, [
      product_id,
      size_id || null,
      color_id || null,
      sku || null,
      stock,
      status,
      track_stock,
    ]);

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "CREATE",
      "product_variants",
      result.rows[0].id,
      null,
      validatedFields.data,
    );

    revalidatePath(`/dashboard/products/edit/${product_id}`);
    return { success: true, message: "Variante añadida exitosamente." };
  } catch (error: any) {
    console.error("❌ Error en createVariantAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al guardar.",
      data: fields,
    };
  }
}

export async function updateVariantAction(
  prevState: ActionState<EditVariantInput>,
  formData: FormData,
): Promise<ActionState<EditVariantInput>> {
  const session = await requireAdminSession();

  const fields = {
    id: Number(formData.get("id")),
    product_id: Number(formData.get("product_id")),
    size_id: formData.get("size_id") ? Number(formData.get("size_id")) : null,
    color_id: formData.get("color_id")
      ? Number(formData.get("color_id"))
      : null,
    sku: formData.get("sku")?.toString() || "",
    stock: Number(formData.get("stock") || "0"),
    track_stock: formData.get("track_stock")?.toString() !== "false",
    status: (formData.get("status")?.toString() || "activo") as
      | "activo"
      | "inactivo",
  };

  try {
    const validatedFields = editVariantSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const {
      id,
      product_id,
      size_id,
      color_id,
      sku,
      stock,
      status,
      track_stock,
    } = validatedFields.data;

    // Validación de duplicados
    const duplicateCheck = await pool.query(
      `SELECT id FROM product_variants 
       WHERE product_id = $1 AND COALESCE(size_id, 0) = COALESCE($2, 0) 
       AND COALESCE(color_id, 0) = COALESCE($3, 0) AND id != $4 AND deleted_at IS NULL`,
      [product_id, size_id || null, color_id || null, id],
    );
    if ((duplicateCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Ya existe otra variante con esta Talla y Color.",
        zodErrors: { size_id: ["Duplicado"], color_id: ["Duplicado"] },
        data: fields,
      };
    }

    const query = `
      UPDATE product_variants SET 
        size_id = $1, color_id = $2, sku = $3, stock = $4, status = $5, track_stock = $6, updated_at = NOW()
      WHERE id = $7 AND product_id = $8 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [
      size_id || null,
      color_id || null,
      sku || null,
      stock,
      status,
      track_stock,
      id,
      product_id,
    ]);

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "No se pudo actualizar (no existe o fue eliminada).",
        data: fields,
      };
    }

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "UPDATE",
      "product_variants",
      id,
      null,
      validatedFields.data,
    );

    revalidatePath(`/dashboard/products/edit/${product_id}`);
    return { success: true, message: "Variante actualizada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en updateVariantAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function toggleVariantStatusAction(
  id: number,
  currentStatus: string,
) {
  const session = await requireAdminSession();
  try {
    const getQuery =
      "SELECT product_id FROM product_variants WHERE id = $1 AND deleted_at IS NULL";
    const result = await pool.query(getQuery, [id]);
    const variant = result.rows[0];

    if (!variant)
      return {
        success: false,
        message: "La variante no existe o fue eliminada.",
      };

    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE product_variants SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`;
    await pool.query(query, [nextStatus, id]);

    // 📋 AUDITORÍA UNIFORME
    await logAudit(session.user.id, "UPDATE", "product_variants", id, null, {
      status: nextStatus,
    });

    revalidatePath(`/dashboard/products/edit/${variant.product_id}`);
    return {
      success: true,
      message: `Variante ${nextStatus === "activo" ? "activada" : "desactivada"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleVariantStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

// 1. MOVER A LA PAPELERA (Soft Delete)
export async function deleteVariantAction(id: number) {
  const session = await requireAdminSession();
  try {
    const { rows } = await pool.query(
      "SELECT product_id FROM product_variants WHERE id = $1",
      [id],
    );
    if (rows.length === 0)
      return { success: false, message: "Variante no encontrada." };
    const productId = rows[0].product_id;

    await pool.query(
      "UPDATE product_variants SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    await logAudit(session.user.id, "SOFT_DELETE", "product_variants", id);

    revalidatePath(`/dashboard/products/edit/${productId}`);
    return { success: true, message: "Variante movida a la papelera." };
  } catch (error: any) {
    console.error("❌ Error en deleteVariantAction:", error.message);
    return {
      success: false,
      message: "No se pudo mover la variante a la papelera.",
    };
  }
}

// 2. ELIMINAR DEFINITIVAMENTE (Hard Delete)
export async function permanentlyDeleteVariantAction(id: number) {
  const session = await requireAdminSession();
  try {
    const { rows } = await pool.query(
      "SELECT product_id FROM product_variants WHERE id = $1",
      [id],
    );
    if (rows.length === 0)
      return { success: false, message: "La variante no existe." };
    const productId = rows[0].product_id;

    await pool.query("DELETE FROM product_variants WHERE id = $1", [id]);
    await logAudit(session.user.id, "HARD_DELETE", "product_variants", id);

    revalidatePath(`/dashboard/products/edit/${productId}`);
    return { success: true, message: "Variante eliminada definitivamente." };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteVariantAction:", error.message);
    if (error.code === "23503") {
      return {
        success: false,
        message:
          "No se puede purgar porque tiene inscripciones o pedidos asociados.",
      };
    }
    return { success: false, message: "No se pudo purgar la variante." };
  }
}

// 3. BULK SOFT DELETE
export async function bulkDeleteVariantsAction(
  ids: number[],
  productId: number,
) {
  const session = await requireAdminSession();
  if (!ids || ids.length === 0)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    const query =
      "UPDATE product_variants SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "product_variants",
      ids.join(","),
    );

    revalidatePath(`/dashboard/products/edit/${productId}`);
    return {
      success: true,
      message: `${ids.length} variantes movidas a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteVariantsAction:", error.message);
    return { success: false, message: "Error al eliminar las variantes." };
  }
}

// 4. BULK HARD DELETE
export async function bulkPermanentlyDeleteVariantsAction(
  ids: number[],
  productId: number,
) {
  const session = await requireAdminSession();
  if (!ids || ids.length === 0)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    const query = "DELETE FROM product_variants WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "product_variants",
      ids.join(","),
    );

    revalidatePath(`/dashboard/products/edit/${productId}`);
    return { success: true, message: "Variantes eliminadas definitivamente." };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteVariantsAction:",
      error.message,
    );
    if (error.code === "23503") {
      return {
        success: false,
        message:
          "Algunas variantes no se pudieron eliminar por tener registros asociados.",
      };
    }
    return { success: false, message: "Error al purgar las variantes." };
  }
}

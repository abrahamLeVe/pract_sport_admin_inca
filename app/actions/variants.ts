"use server";

import { requireAdminSession } from "@/lib/auth-guard";
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
  await requireAdminSession();

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
        message: "Por favor, corrige los errores del formulario.",
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
         AND COALESCE(color_id, 0) = COALESCE($3, 0)`,
      [product_id, size_id || null, color_id || null],
    );

    if ((duplicateCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Ya existe una variante con esta misma Talla y Color.",
        zodErrors: {
          size_id: ["Combinación duplicada"],
          color_id: ["Combinación duplicada"],
        },
        data: fields,
      };
    }

    if (sku) {
      const skuCheck = await pool.query(
        "SELECT id FROM product_variants WHERE sku = $1",
        [sku],
      );
      if ((skuCheck.rowCount ?? 0) > 0) {
        return {
          success: false,
          message: "Este código SKU ya está registrado en otra variante.",
          zodErrors: { sku: ["SKU duplicado"] },
          data: fields,
        };
      }
    }

    const query = `
      INSERT INTO product_variants (product_id, size_id, color_id, sku, stock, status, track_stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    await pool.query(query, [
      product_id,
      size_id || null,
      color_id || null,
      sku || null,
      stock,
      status,
      track_stock,
    ]);

    revalidatePath(`/dashboard/products/edit/${product_id}`);

    return {
      success: true,
      message: "Variante añadida exitosamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en createVariantAction:", error.message);

    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
      data: fields,
    };
  }
}

export async function updateVariantAction(
  prevState: ActionState<EditVariantInput>,
  formData: FormData,
): Promise<ActionState<EditVariantInput>> {
  await requireAdminSession();

  const rawSizeId = formData.get("size_id")?.toString();
  const rawColorId = formData.get("color_id")?.toString();

  const fields = {
    id: Number(formData.get("id")),
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
    const validatedFields = editVariantSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
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

    const duplicateCheck = await pool.query(
      `SELECT id FROM product_variants 
       WHERE product_id = $1 
         AND COALESCE(size_id, 0) = COALESCE($2, 0) 
         AND COALESCE(color_id, 0) = COALESCE($3, 0)
         AND id != $4`,
      [product_id, size_id || null, color_id || null, id],
    );

    if ((duplicateCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Ya existe otra variante con esta misma Talla y Color.",
        zodErrors: {
          size_id: ["Combinación duplicada"],
          color_id: ["Combinación duplicada"],
        },
        data: fields,
      };
    }

    if (sku) {
      const skuCheck = await pool.query(
        "SELECT id FROM product_variants WHERE sku = $1 AND id != $2",
        [sku, id],
      );
      if ((skuCheck.rowCount ?? 0) > 0) {
        return {
          success: false,
          message: "Este código SKU ya lo usa otra variante.",
          zodErrors: { sku: ["SKU duplicado"] },
          data: fields,
        };
      }
    }

    const query = `
      UPDATE product_variants SET 
        size_id = $1, color_id = $2, sku = $3, stock = $4, status = $5, track_stock = $6, updated_at = NOW()
      WHERE id = $7 AND product_id = $8
    `;

    await pool.query(query, [
      size_id || null,
      color_id || null,
      sku || null,
      stock,
      status,
      track_stock,
      id,
      product_id,
    ]);

    revalidatePath(`/dashboard/products/edit/${product_id}`);

    return {
      success: true,
      message: "Variante actualizada correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en updateVariantAction:", error.message);

    return {
      success: false,
      message: error.message || "Error al actualizar la variante.",
      data: fields,
    };
  }
}

export async function deleteVariantAction(id: number) {
  await requireAdminSession();

  try {
    const getQuery = "SELECT product_id FROM product_variants WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const variant = result.rows[0];

    if (!variant) return { success: false, message: "La variante no existe." };

    const deleteQuery = "DELETE FROM product_variants WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    revalidatePath(`/dashboard/products/edit/${variant.product_id}`);

    return { success: true, message: "Variante eliminada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteVariantAction:", error.message);
    return {
      success: false,
      message: "No se pudo eliminar la variante.",
    };
  }
}

export async function toggleVariantStatusAction(
  id: number,
  currentStatus: string,
) {
  await requireAdminSession();

  try {
    const getQuery = "SELECT product_id FROM product_variants WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const variant = result.rows[0];

    if (!variant) return { success: false, message: "La variante no existe." };

    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE product_variants SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

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

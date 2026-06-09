"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  editVariantSchema,
  FormVariantState,
  variantSchema,
} from "@/validations/variants";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function createVariantAction(
  prevState: FormVariantState,
  formData: FormData,
): Promise<FormVariantState> {
  try {
    await requireAdminSession();

    const fields = {
      product_id: formData.get("product_id")?.toString() || "",
      size: formData.get("size")?.toString() || "",
      color: formData.get("color")?.toString() || "",
      sku: formData.get("sku")?.toString() || "",
      stock: formData.get("stock")?.toString() || "0",
      status: formData.get("status")?.toString() || "activo",
    };

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

    const { product_id, size, color, sku, stock, status } =
      validatedFields.data;

    const duplicateCheck = await pool.query(
      `SELECT id FROM product_variants 
       WHERE product_id = $1 
         AND COALESCE(size, '') = COALESCE($2, '') 
         AND COALESCE(color, '') = COALESCE($3, '')`,
      [product_id, size || null, color || null],
    );

    if ((duplicateCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Ya existe una variante con esta misma Talla y Color.",

        zodErrors: {
          size: ["Combinación duplicada"],
          color: ["Combinación duplicada"],
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
      INSERT INTO product_variants (product_id, size, color, sku, stock, status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [
      product_id,
      size || null,
      color || null,
      sku || null,
      stock,
      status,
    ]);

    revalidatePath(`/dashboard/products/edit/${product_id}`);

    return {
      success: true,
      message: "Variante añadida exitosamente.",
      data: {},
    };
  } catch (error: any) {
    console.error("❌ Error en createVariantAction:", error.message);

    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
    };
  }
}

export async function updateVariantAction(
  prevState: FormVariantState,
  formData: FormData,
): Promise<FormVariantState> {
  try {
    await requireAdminSession();

    const fields = {
      id: formData.get("id")?.toString() || "",
      product_id: formData.get("product_id")?.toString() || "",
      size: formData.get("size")?.toString() || "",
      color: formData.get("color")?.toString() || "",
      sku: formData.get("sku")?.toString() || "",
      stock: formData.get("stock")?.toString() || "0",
      status: formData.get("status")?.toString() || "activo",
    };

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

    const { id, product_id, size, color, sku, stock, status } =
      validatedFields.data;

    const duplicateCheck = await pool.query(
      `SELECT id FROM product_variants 
       WHERE product_id = $1 
         AND COALESCE(size, '') = COALESCE($2, '') 
         AND COALESCE(color, '') = COALESCE($3, '')
         AND id != $4`,
      [product_id, size || null, color || null, id],
    );

    if ((duplicateCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Ya existe otra variante con esta misma Talla y Color.",
        zodErrors: {
          size: ["Combinación duplicada"],
          color: ["Combinación duplicada"],
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
        size = $1, color = $2, sku = $3, stock = $4, status = $5, updated_at = NOW()
      WHERE id = $6 AND product_id = $7
    `;

    await pool.query(query, [
      size || null,
      color || null,
      sku || null,
      stock,
      status,
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
    };
  }
}

export async function deleteVariantAction(id: number) {
  try {
    await requireAdminSession();

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
  try {
    await requireAdminSession();

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

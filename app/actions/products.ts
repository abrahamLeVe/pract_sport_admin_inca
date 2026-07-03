"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { handleMultipleImagesUpload } from "@/lib/upload";
import { ActionState } from "@/validations/core";
import {
  EditProductInput,
  editProductSchema,
  ProductInput,
  productSchema,
} from "@/validations/products";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action } from "./storage";

const REVALIDATE_ROUTE = "/dashboard/products";

export async function createProductAction(
  prevState: ActionState<ProductInput>,
  formData: FormData,
): Promise<ActionState<ProductInput>> {
  const session = await requireAdminSession();

  const fields = {
    name: formData.get("name")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    price: Number(formData.get("price") || 0),
    discount_price: Number(formData.get("discount_price") || 0),
    stock: Number(formData.get("stock")?.toString() || 0),
    category_id: Number(formData.get("category_id")),
    brand_id: Number(formData.get("brand_id")),
    status: (formData.get("status")?.toString() || "activo") as
      | "activo"
      | "inactivo",
    track_stock: formData.get("track_stock")?.toString() !== "false",
  };

  try {
    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND deleted_at IS NULL",
      [fields.slug],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está en uso.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };
    }

    const validatedFields = productSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const imageResult = await handleMultipleImagesUpload(
      formData,
      "images",
      "products",
      true,
    );
    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message,
        zodErrors: { images: [imageResult.message || "Se requiere imagen"] },
        data: fields,
      };
    }

    const {
      name,
      slug,
      description,
      price,
      discount_price,
      stock,
      category_id,
      brand_id,
      status,
      track_stock,
    } = validatedFields.data;

    // 🔥 RETURNING id para auditoría
    const query = `
      INSERT INTO products (name, slug, description, price, discount_price, stock, category_id, brand_id, images, status, track_stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    const result = await pool.query(query, [
      name,
      slug,
      description || null,
      price,
      discount_price || null,
      stock,
      category_id,
      brand_id,
      JSON.stringify(imageResult.images),
      status,
      track_stock,
    ]);

    const newId = result.rows[0].id;
    await logAudit(
      session.user.id,
      "CREATE",
      "products",
      newId,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);
  } catch (error: any) {
    console.error("❌ Error en createProductAction:", error.message);
    return {
      success: false,
      message: "Error al crear el producto.",
      data: fields,
    };
  }
  redirect("/dashboard/products");
}

export async function updateProductAction(
  prevState: ActionState<EditProductInput>,
  formData: FormData,
): Promise<ActionState<EditProductInput>> {
  const session = await requireAdminSession();

  const fields = {
    id: Number(formData.get("id")),
    name: formData.get("name")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    price: Number(formData.get("price") || 0),
    discount_price: Number(formData.get("discount_price") || 0),
    stock: Number(formData.get("stock")?.toString() || 0),
    category_id: Number(formData.get("category_id")),
    brand_id: Number(formData.get("brand_id")),
    status: (formData.get("status")?.toString() || "activo") as
      | "activo"
      | "inactivo",
    track_stock: formData.get("track_stock")?.toString() !== "false",
  };

  try {
    const validatedFields = editProductSchema.safeParse(fields);
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
      name,
      slug,
      description,
      price,
      discount_price,
      stock,
      category_id,
      brand_id,
      status,
      track_stock,
    } = validatedFields.data;

    // 0. Validar Slug
    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND id != $2 AND deleted_at IS NULL",
      [slug, id],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está siendo usado por otro producto.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };
    }

    // ========================================================================
    // 🔥 PASO 1: BARRERA DE SEGURIDAD Y OBTENCIÓN DE IMÁGENES ANTIGUAS
    // ========================================================================
    const oldProductResult = await pool.query(
      "SELECT images FROM products WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    // Si no devuelve nada, el producto no existe o está en la basura. ¡Bloqueamos!
    if (oldProductResult.rowCount === 0) {
      return {
        success: false,
        message:
          "❌ El producto no se pudo actualizar porque no existe o está en la papelera.",
        data: fields,
      };
    }

    const oldImagesStr = oldProductResult.rows[0].images;
    const oldImages =
      typeof oldImagesStr === "string"
        ? JSON.parse(oldImagesStr)
        : oldImagesStr || [];

    // ========================================================================
    // PASO 2: PROCESAR IMÁGENES EN S3 (Solo llega aquí si es seguro)
    // ========================================================================
    const existingImagesStr =
      formData.get("existing_images")?.toString() || "[]";
    let existingImages = [];
    try {
      existingImages = JSON.parse(existingImagesStr);
    } catch (e) {
      existingImages = [];
    }

    const imageResult = await handleMultipleImagesUpload(
      formData,
      "images",
      "products",
      false,
    );

    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message || "Error al subir imágenes",
        zodErrors: {
          images: [imageResult.message || "Se requiere una imagen"],
        },
        data: fields,
      };
    }

    const newImagesJson = imageResult.images || [];
    const finalImagesJson = [...existingImages, ...newImagesJson];

    // ========================================================================
    // PASO 3: LIMPIAR BASURA DE S3
    // ========================================================================
    const finalKeys = finalImagesJson.map((img: any) => img.key);
    const imagesToDelete = oldImages.filter(
      (img: { key: string }) => !finalKeys.includes(img.key),
    );

    for (const img of imagesToDelete) {
      if (img.key) await deleteFileFromS3Action(img.key);
    }

    // ========================================================================
    // PASO 4: ACTUALIZAR LA BASE DE DATOS
    // ========================================================================
    let finalStock = stock;
    const variantStockCheck = await pool.query(
      `SELECT SUM(stock) as total FROM product_variants 
       -- 🔥 AGREGAMOS "AND deleted_at IS NULL"
       WHERE product_id = $1 AND track_stock = TRUE AND status = 'activo' AND deleted_at IS NULL`,
      [id],
    );

    if (variantStockCheck.rows[0].total !== null) {
      finalStock = Number(variantStockCheck.rows[0].total);
    }

    const query = `
      UPDATE products SET 
        name = $1, slug = $2, description = $3, price = $4, discount_price = $5, stock = $6, 
        category_id = $7, brand_id = $8, images = $9, status = $10, track_stock = $11, updated_at = NOW()
      WHERE id = $12 AND deleted_at IS NULL
    `;

    // Ya sabemos que pasará el filtro, pero lo dejamos por consistencia
    await pool.query(query, [
      name,
      slug,
      description || null,
      price,
      discount_price || null,
      finalStock,
      category_id,
      brand_id,
      JSON.stringify(finalImagesJson),
      status,
      track_stock,
      id,
    ]);
    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "UPDATE",
      "products",
      id,
      null,
      validatedFields.data,
    );
    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "¡Producto actualizado exitosamente!",
      data: fields,
    };
  } catch (error: any) {
    console.error("❌ Error en updateProductAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar el producto.",
      data: fields,
    };
  }
}

export async function toggleProductStatusAction(
  id: number,
  currentStatus: string,
) {
  const session = await requireAdminSession();
  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`;
    const result = await pool.query(query, [nextStatus, id]);

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "No se pudo actualizar (no existe o está en papelera).",
      };
    }

    // 📋 AUDITORÍA UNIFORME
    await logAudit(session.user.id, "UPDATE", "products", id, null, {
      status: nextStatus,
    });

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `Producto ${nextStatus === "activo" ? "activado" : "desactivado"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleProductStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}
// 1. MOVER A LA PAPELERA (Soft Delete)
export async function deleteProductAction(id: number) {
  const session = await requireAdminSession();
  try {
    await pool.query("UPDATE products SET deleted_at = NOW() WHERE id = $1", [
      id,
    ]);
    await logAudit(session.user.id, "SOFT_DELETE", "products", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Producto movido a la papelera de reciclaje.",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteProductAction:", error.message);
    return {
      success: false,
      message: "No se pudo mover el producto a la papelera.",
    };
  }
}

// 2. ELIMINAR DEFINITIVAMENTE (Aquí reutilizas tu código original intacto)
export async function permanentlyDeleteProductAction(id: number) {
  const session = await requireAdminSession();
  try {
    const getQuery = "SELECT images FROM products WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const product = result.rows[0];
    if (!product) return { success: false, message: "El producto no existe." };

    // Tu lógica original de S3 se queda aquí
    const images =
      typeof product.images === "string"
        ? JSON.parse(product.images)
        : product.images || [];
    for (const img of images) {
      if (img.key) {
        await deleteFileFromS3Action(img.key);
      }
    }

    // Borrado físico real de la base de datos
    const deleteQuery = "DELETE FROM products WHERE id = $1";
    await pool.query(deleteQuery, [id]);
    await logAudit(session.user.id, "HARD_DELETE", "products", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Producto eliminado definitivamente con sus imágenes.",
    };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteProductAction:", error.message);
    return { success: false, message: "No se pudo purgar el producto." };
  }
}

export async function bulkDeleteProductsAction(ids: number[]) {
  const session = await requireAdminSession();
  if (!ids || ids.length === 0)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    // Actualiza todos los productos seleccionados en un único query ultra rápido
    const query = "UPDATE products SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    // Auditoría del lote completo
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "products",
      ids.join(","),
    );

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `${ids.length} productos movidos a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteProductsAction:", error.message);
    return {
      success: false,
      message: "Error al eliminar los elementos seleccionados.",
    };
  }
}

export async function bulkPermanentlyDeleteProductsAction(ids: number[]) {
  const session = await requireAdminSession();
  if (!ids || ids.length === 0)
    return { success: false, message: "No hay elementos seleccionados." };

  try {
    // 1. Traemos las imágenes de todos los productos seleccionados a la vez
    const getQuery = "SELECT images FROM products WHERE id = ANY($1)";
    const result = await pool.query(getQuery, [ids]);

    // 2. Recorremos todas las filas devueltas para limpiar S3
    for (const row of result.rows) {
      const images =
        typeof row.images === "string"
          ? JSON.parse(row.images)
          : row.images || [];
      for (const img of images) {
        if (img.key) {
          await deleteFileFromS3Action(img.key);
        }
      }
    }

    // 3. Borrado físico de todos los registros en un solo comando
    const deleteQuery = "DELETE FROM products WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "products",
      ids.join(","),
    );

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Elementos eliminados permanentemente del sistema y de S3.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteProductsAction:",
      error.message,
    );
    return {
      success: false,
      message: "No se pudieron purgar los elementos seleccionados.",
    };
  }
}

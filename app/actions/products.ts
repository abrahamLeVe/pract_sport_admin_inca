"use server";

import { requireAdminSession } from "@/lib/auth-guard";
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

export async function createProductAction(
  prevState: ActionState<ProductInput>,
  formData: FormData,
): Promise<ActionState<ProductInput>> {
  await requireAdminSession();

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
      "SELECT id FROM products WHERE slug = $1",
      [fields.slug],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está en uso. Por favor, elige otro.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };
    }

    const validatedFields = productSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
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
        zodErrors: { images: [imageResult.message] } as any,
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

    const query = `
      INSERT INTO products (
        name, slug, description, price, discount_price, stock, 
        category_id, brand_id, images, status, track_stock
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await pool.query(query, [
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

    revalidatePath("/dashboard/products");
  } catch (error: any) {
    console.error("❌ Error en createProductAction:", error.message);

    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
      data: fields,
    };
  }

  redirect("/dashboard/products");
}

export async function updateProductAction(
  prevState: ActionState<EditProductInput>,
  formData: FormData,
): Promise<ActionState<EditProductInput>> {
  await requireAdminSession();

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

    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND id != $2",
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
      true,
    );

    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message || "Error al subir imágenes",
        zodErrors: { images: [imageResult.message || "Error"] } as any,
        data: fields,
      };
    }

    const newImagesJson = imageResult.images || [];
    const finalImagesJson = [...existingImages, ...newImagesJson];

    const oldProductResult = await pool.query(
      "SELECT images FROM products WHERE id = $1",
      [id],
    );
    const oldImagesStr = oldProductResult.rows[0]?.images;
    const oldImages =
      typeof oldImagesStr === "string"
        ? JSON.parse(oldImagesStr)
        : oldImagesStr || [];

    const finalKeys = finalImagesJson.map((img: any) => img.key);
    const imagesToDelete = oldImages.filter(
      (img: { key: string }) => !finalKeys.includes(img.key),
    );

    for (const img of imagesToDelete) {
      if (img.key) await deleteFileFromS3Action(img.key);
    }

    let finalStock = stock;

    const variantStockCheck = await pool.query(
      `SELECT SUM(stock) as total 
       FROM product_variants 
       WHERE product_id = $1 
         AND track_stock = TRUE 
         AND status = 'activo'`,
      [id],
    );

    if (variantStockCheck.rows[0].total !== null) {
      finalStock = Number(variantStockCheck.rows[0].total);
    }

    const query = `
      UPDATE products SET 
        name = $1, slug = $2, description = $3, price = $4, discount_price = $5, stock = $6, 
        category_id = $7, brand_id = $8, images = $9, status = $10, track_stock = $11, updated_at = NOW()
      WHERE id = $12
    `;

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

    revalidatePath("/dashboard/products");
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

export async function deleteProductAction(id: number) {
  await requireAdminSession();
  try {
    const getQuery = "SELECT images FROM products WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const product = result.rows[0];
    if (!product) return { success: false, message: "El producto no existe." };
    const images =
      typeof product.images === "string"
        ? JSON.parse(product.images)
        : product.images || [];
    for (const img of images) {
      if (img.key) {
        await deleteFileFromS3Action(img.key);
      }
    }
    const deleteQuery = "DELETE FROM products WHERE id = $1";
    await pool.query(deleteQuery, [id]);
    revalidatePath("/dashboard/products");
    return { success: true, message: "Producto eliminado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteProductAction:", error.message);
    return {
      success: false,
      message:
        "No se pudo eliminar el producto (quizás tiene ventas u órdenes asociadas).",
    };
  }
}

export async function toggleProductStatusAction(
  id: number,
  currentStatus: string,
) {
  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";
    const query = `UPDATE products SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);
    revalidatePath("/dashboard/products");
    return {
      success: true,
      message: `Producto ${nextStatus === "activo" ? "activado" : "desactivado"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleProductStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

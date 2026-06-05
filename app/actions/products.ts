"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  productSchema,
  editProductSchema,
  FormProductState,
} from "@/validations/products";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteFileFromS3Action, uploadFileToS3Action } from "./storage";
import z from "zod";

export async function createProductAction(
  prevState: FormProductState,
  formData: FormData,
): Promise<FormProductState> {
  try {
    await requireAdminSession();

    const fields = {
      name: formData.get("name")?.toString() || "",
      slug: formData.get("slug")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      price: formData.get("price")?.toString() || "",
      discount_price: formData.get("discount_price")?.toString() || "",
      stock: formData.get("stock")?.toString() || "",
      category_id: formData.get("category_id")?.toString() || "",
      brand_id: formData.get("brand_id")?.toString() || "",
      status: formData.get("status")?.toString() || "activo",
    };

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

    const files = formData.getAll("images") as File[];
    const validFiles = files.filter((f) => f.size > 0);

    if (validFiles.length > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      for (const file of validFiles) {
        if (!validTypes.includes(file.type)) {
          return {
            success: false,
            message:
              "Formato no permitido en una de las imágenes. Solo JPG, PNG o WEBP.",
            zodErrors: { images: ["El archivo debe ser una imagen."] },
            data: fields,
          };
        }
        if (file.size > 5 * 1024 * 1024) {
          return {
            success: false,
            message: "Una de las imágenes supera el límite de 5MB.",
            zodErrors: { images: ["El archivo es demasiado pesado."] },
            data: fields,
          };
        }
      }
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

    const imageUploads = await Promise.all(
      validFiles.map(async (file) => {
        return await uploadFileToS3Action(file, "products");
      }),
    );

    const imagesJson = imageUploads
      .filter((res) => res && res.success)
      .map((res) => ({ url: res?.url, key: res?.key }));

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
    } = validatedFields.data;

    const query = `
      INSERT INTO products (
        name, slug, description, price, discount_price, stock, 
        category_id, brand_id, images, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
      JSON.stringify(imagesJson),
      status,
    ]);

    revalidatePath("/dashboard/products");
  } catch (error: any) {
    console.error("❌ Error en createProductAction:", error.message);

    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
    };
  }

  redirect("/dashboard/products");
}

export async function updateProductAction(
  prevState: FormProductState,
  formData: FormData,
): Promise<FormProductState> {
  try {
    await requireAdminSession();

    const rawFormData = {
      id: formData.get("id")?.toString() || "",
      name: formData.get("name")?.toString() || "",
      slug: formData.get("slug")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      price: formData.get("price")?.toString() || "",
      discount_price: formData.get("discount_price")?.toString() || "",
      stock: formData.get("stock")?.toString() || "",
      category_id: formData.get("category_id")?.toString() || "",
      brand_id: formData.get("brand_id")?.toString() || "",
      status: formData.get("status")?.toString() || "activo",
    };

    const validatedFields = editProductSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: rawFormData,
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
    } = validatedFields.data;

    // Validar unicidad del Slug (que no lo use OTRO producto)
    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND id != $2",
      [slug, id],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está siendo usado por otro producto.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: rawFormData,
      };
    }

    // Procesar imágenes que se deciden mantener
    const existingImagesStr =
      formData.get("existing_images")?.toString() || "[]";
    const existingImages = JSON.parse(existingImagesStr);

    // Procesar nuevas imágenes
    const files = formData.getAll("images") as File[];
    const validFiles = files.filter((f) => f.size > 0);

    if (validFiles.length > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      for (const file of validFiles) {
        if (!validTypes.includes(file.type)) {
          return {
            success: false,
            message: "Formato no permitido en las imágenes nuevas.",
            zodErrors: { images: ["El archivo debe ser una imagen."] },
            data: rawFormData,
          };
        }
        if (file.size > 5 * 1024 * 1024) {
          return {
            success: false,
            message: "Una de las imágenes nuevas supera los 5MB.",
            zodErrors: { images: ["El archivo es demasiado pesado."] },
            data: rawFormData,
          };
        }
      }
    }

    const imageUploads = await Promise.all(
      validFiles.map(async (file) => {
        return await uploadFileToS3Action(file, "products");
      }),
    );

    const newImagesJson = imageUploads
      .filter((res) => res && res.success)
      .map((res) => ({ url: res?.url, key: res?.key }));

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

    const finalKeys = finalImagesJson.map((img) => img.key);
    const imagesToDelete = oldImages.filter(
      (img: { key: string }) => !finalKeys.includes(img.key),
    );

    for (const img of imagesToDelete) {
      if (img.key) await deleteFileFromS3Action(img.key);
    }

    const query = `
      UPDATE products SET 
        name = $1, slug = $2, description = $3, price = $4, discount_price = $5, stock = $6, 
        category_id = $7, brand_id = $8, images = $9, status = $10, updated_at = NOW()
      WHERE id = $11
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
      JSON.stringify(finalImagesJson),
      status,
      id,
    ]);

    revalidatePath("/dashboard/products");
  } catch (error: any) {
    console.error("❌ Error en updateProductAction:", error.message);

    return {
      success: false,
      message: error.message || "Error al actualizar el producto.",
    };
  }

  redirect("/dashboard/products");
}

export async function deleteProductAction(id: number) {
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

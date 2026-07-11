"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { handleMediaUpload, handleMultipleImagesUpload } from "@/lib/upload";
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
import { deleteFileFromS3Action } from "../storage";
import sharp from "sharp";

const REVALIDATE_ROUTE = "/dashboard/products";

export async function createProductAction(
  prevState: ActionState<ProductInput>,
  formData: FormData,
): Promise<ActionState<ProductInput>> {
  const session = await requireAdminSession();
  let client;

  const fields = {
    name: formData.get("name")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    price: Number(formData.get("price") || 0),
    discount_price: Number(formData.get("discount_price") || 0),
    stock: Number(formData.get("stock")?.toString() || 0),
    category_id: Number(formData.get("category_id")),
    brand_id: Number(formData.get("brand_id")),
    gender_id: Number(formData.get("gender_id")),
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
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: z.flattenError(validatedFields.error).fieldErrors,
        data: fields,
      };
    }

    const coverFile = formData.get("image") as File | null;
    const galleryFiles = formData.getAll("gallery_files") as File[];

    if (!coverFile || coverFile.size === 0) {
      return {
        success: false,
        message: "La portada es obligatoria",
        zodErrors: { image: ["Se requiere portada"] },
        data: fields,
      };
    }

    client = await pool.connect();
    await client.query("BEGIN");

    const coverFormData = new FormData();
    coverFormData.append("media_file", coverFile);
    const coverUpload = await handleMediaUpload(
      coverFormData,
      "media_file",
      "products",
      "image",
      false,
    );
    if (!coverUpload.success) throw new Error("Error subiendo la portada.");

    const {
      name,
      slug,
      description,
      price,
      discount_price,
      stock,
      category_id,
      brand_id,
      gender_id,
      status,
      track_stock,
    } = validatedFields.data;

    const query = `
      INSERT INTO products (name, slug, description, price, discount_price, stock, category_id, brand_id, gender_id, image_url, image_key, status, track_stock)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id
    `;
    const result = await client.query(query, [
      name,
      slug,
      description || null,
      price,
      discount_price || null,
      stock,
      category_id,
      brand_id,
      gender_id,
      coverUpload.url,
      coverUpload.key,
      status,
      track_stock,
    ]);
    const newId = result.rows[0].id;

    for (const [index, file] of galleryFiles.entries()) {
      if (!file || file.size === 0) continue;

      let width = null,
        height = null;
      let mediaType: "document" | "image" | "video" | "merch" = "document";
      if (file.type.startsWith("image/")) mediaType = "image";
      else if (file.type.startsWith("video/")) mediaType = "video";

      if (mediaType === "image") {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const metadata = await sharp(buffer).metadata();
          width = metadata.width || null;
          height = metadata.height || null;
        } catch (e) {
          console.error(e);
        }
      }

      const gFormData = new FormData();
      gFormData.append("media_file", file);
      const upload = await handleMediaUpload(
        gFormData,
        "media_file",
        "media",
        mediaType,
        true,
      );
      if (!upload.success) throw new Error(`Error al subir: ${file.name}`);

      const mediaRes = await client.query(
        `INSERT INTO media (media_type, media_url, media_key, file_name, file_format, size_bytes, width, height, folder_name) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'products') RETURNING id`,
        [
          mediaType,
          upload.url,
          upload.key,
          file.name,
          file.type,
          file.size,
          width,
          height,
        ],
      );

      await client.query(
        "INSERT INTO media_links (media_id, model_id, model_type, display_order) VALUES ($1, $2, 'product', $3)",
        [mediaRes.rows[0].id, newId, index],
      );
    }

    await client.query("COMMIT");
    await logAudit(
      session.user.id,
      "CREATE",
      "products",
      newId,
      null,
      validatedFields.data,
    );
    revalidatePath("/dashboard/products");
  } catch (error: any) {
    if (client) await client.query("ROLLBACK");
    return {
      success: false,
      message: error.message || "Error al crear el producto.",
      data: fields,
    };
  } finally {
    if (client) client.release();
  }

  redirect("/dashboard/products");
}

// ============================================================================
// EDITAR / ACTUALIZAR PRODUCTO
// ============================================================================
export async function updateProductAction(
  prevState: ActionState<EditProductInput>,
  formData: FormData,
): Promise<ActionState<EditProductInput>> {
  const session = await requireAdminSession();
  let client;

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
    gender_id: Number(formData.get("gender_id")),
    status: (formData.get("status")?.toString() || "activo") as
      | "activo"
      | "inactivo",
    track_stock: formData.get("track_stock")?.toString() !== "false",
  };

  try {
    const validatedFields = editProductSchema.safeParse(fields);
    if (!validatedFields.success) {
      return {
        success: false,
        message: "Corrige los errores del formulario.",
        zodErrors: z.flattenError(validatedFields.error).fieldErrors,
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
      gender_id,
      status,
      track_stock,
    } = validatedFields.data;

    const slugCheck = await pool.query(
      "SELECT id FROM products WHERE slug = $1 AND id != $2 AND deleted_at IS NULL",
      [slug, id],
    );
    if ((slugCheck.rowCount ?? 0) > 0)
      return {
        success: false,
        message: "Este Slug ya está en uso.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };

    const oldProduct = await pool.query(
      "SELECT image_url, image_key FROM products WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    if (oldProduct.rowCount === 0)
      return {
        success: false,
        message: "El producto no existe.",
        data: fields,
      };

    let finalImageUrl = oldProduct.rows[0].image_url;
    let finalImageKey = oldProduct.rows[0].image_key;
    let coverKeyToDelete: string | null = null;
    let keysToDeleteFromS3: string[] = [];

    client = await pool.connect();
    await client.query("BEGIN");

    // 1. Portada
    const coverFile = formData.get("image") as File | null;
    if (coverFile && coverFile.size > 0) {
      const coverFormData = new FormData();
      coverFormData.append("media_file", coverFile);
      const coverUpload = await handleMediaUpload(
        coverFormData,
        "media_file",
        "products",
        "image",
        false,
      );
      if (!coverUpload.success)
        throw new Error("Error subiendo la nueva portada.");

      finalImageUrl = coverUpload.url;
      finalImageKey = coverUpload.key;
      coverKeyToDelete = oldProduct.rows[0].image_key;
    }

    let finalStock = stock;
    const variantStockCheck = await client.query(
      `SELECT SUM(stock) as total FROM product_variants WHERE product_id = $1 AND track_stock = TRUE AND status = 'activo' AND deleted_at IS NULL`,
      [id],
    );
    if (variantStockCheck.rows[0].total !== null)
      finalStock = Number(variantStockCheck.rows[0].total);

    await client.query(
      `
      UPDATE products SET 
        name=$1, slug=$2, description=$3, price=$4, discount_price=$5, stock=$6, 
        category_id=$7, brand_id=$8, gender_id=$9, image_url=$10, image_key=$11, status=$12, track_stock=$13, updated_at=NOW()
      WHERE id=$14`,
      [
        name,
        slug,
        description || null,
        price,
        discount_price || null,
        finalStock,
        category_id,
        brand_id,
        gender_id,
        finalImageUrl,
        finalImageKey,
        status,
        track_stock,
        id,
      ],
    );

    // 2. GESTIÓN DEL MAPA DE ORDEN DE GALERÍA
    const galleryOrderStr = formData.get("gallery_order")?.toString() || "[]";
    const galleryOrder = JSON.parse(galleryOrderStr) as {
      type: string;
      key?: string;
    }[];
    const galleryFiles = formData.getAll("gallery_files") as File[];

    const retainedKeys = galleryOrder
      .filter((o) => o.type === "existing")
      .map((o) => o.key);

    const oldGallery = await client.query(
      `SELECT m.id, m.media_key FROM media m JOIN media_links ml ON m.id = ml.media_id WHERE ml.model_id = $1 AND ml.model_type = 'product'`,
      [id],
    );

    const mediaToDelete = oldGallery.rows.filter(
      (r) => !retainedKeys.includes(r.media_key),
    );
    if (mediaToDelete.length > 0) {
      const idsToDelete = mediaToDelete.map((m) => m.id);
      keysToDeleteFromS3 = mediaToDelete
        .map((m) => m.media_key)
        .filter(Boolean);
      await client.query("DELETE FROM media WHERE id = ANY($1)", [idsToDelete]);
    }

    // Borramos links para regenerarlos en el orden exacto del mapa
    await client.query(
      "DELETE FROM media_links WHERE model_id = $1 AND model_type = 'product'",
      [id],
    );

    let newFileIndex = 0;
    let displayOrder = 0;

    for (const item of galleryOrder) {
      if (item.type === "existing" && item.key) {
        const existingMedia = await client.query(
          "SELECT id FROM media WHERE media_key = $1",
          [item.key],
        );
        if (existingMedia.rowCount && existingMedia.rowCount > 0) {
          await client.query(
            "INSERT INTO media_links (media_id, model_id, model_type, display_order) VALUES ($1, $2, 'product', $3)",
            [existingMedia.rows[0].id, id, displayOrder++],
          );
        }
      } else if (item.type === "new") {
        const file = galleryFiles[newFileIndex++];
        if (!file || file.size === 0) continue;

        let width = null,
          height = null;
        let mediaType: "document" | "image" | "video" | "merch" = "document";
        if (file.type.startsWith("image/")) mediaType = "image";
        else if (file.type.startsWith("video/")) mediaType = "video";

        if (mediaType === "image") {
          try {
            const buffer = Buffer.from(await file.arrayBuffer());
            const metadata = await sharp(buffer).metadata();
            width = metadata.width || null;
            height = metadata.height || null;
          } catch (e) {}
        }

        const gFormData = new FormData();
        gFormData.append("media_file", file);
        const upload = await handleMediaUpload(
          gFormData,
          "media_file",
          "media",
          mediaType,
          true,
        );
        if (!upload.success) throw new Error(`Error al subir: ${file.name}`);

        const mediaRes = await client.query(
          `INSERT INTO media (media_type, media_url, media_key, file_name, file_format, size_bytes, width, height, folder_name) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'products') RETURNING id`,
          [
            mediaType,
            upload.url,
            upload.key,
            file.name,
            file.type,
            file.size,
            width,
            height,
          ],
        );

        await client.query(
          "INSERT INTO media_links (media_id, model_id, model_type, display_order) VALUES ($1, $2, 'product', $3)",
          [mediaRes.rows[0].id, id, displayOrder++],
        );
      }
    }

    await client.query("COMMIT");

    if (coverKeyToDelete) await deleteFileFromS3Action(coverKeyToDelete);
    for (const key of keysToDeleteFromS3) await deleteFileFromS3Action(key);

    await logAudit(
      session.user.id,
      "UPDATE",
      "products",
      id,
      null,
      validatedFields.data,
    );
    revalidatePath("/dashboard/products");
    return {
      success: true,
      message: "¡Producto actualizado exitosamente!",
      data: fields,
    };
  } catch (error: any) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error en updateProductAction:", error.message);
    return {
      success: false,
      message: "Error al actualizar el producto.",
      data: fields,
    };
  } finally {
    if (client) client.release();
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
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Marcar el producto como eliminado
    await client.query("UPDATE products SET deleted_at = NOW() WHERE id = $1", [
      id,
    ]);

    // 2. Marcar TODAS las variantes asociadas como eliminadas
    await client.query(
      "UPDATE product_variants SET deleted_at = NOW() WHERE product_id = $1 AND deleted_at IS NULL",
      [id],
    );

    await logAudit(session.user.id, "SOFT_DELETE", "products", id);

    await client.query("COMMIT");
    revalidatePath("/dashboard/products");
    return {
      success: true,
      message: "Producto y sus variantes movidos a la papelera.",
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    return { success: false, message: "Error al mover a la papelera." };
  } finally {
    client.release();
  }
}

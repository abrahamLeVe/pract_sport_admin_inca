"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { handleMediaUpload } from "@/lib/upload";
import {
  CategoryInput,
  categorySchema,
  EditCategoryInput,
  editCategorySchema,
} from "@/validations/categories";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action } from "./storage";
const REVALIDATE_ROUTE = "/dashboard/categories";

export async function createCategoryAction(
  prevState: ActionState<CategoryInput>,
  formData: FormData,
): Promise<ActionState<CategoryInput>> {
  const session = await requireAdminSession(); // 🔥 Obtener sesión
  const fields = {
    name: formData.get("name")?.toString().trim() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    status: formData.get("status")?.toString() as
      | "activo"
      | "inactivo"
      | undefined,
  };

  try {
    const validatedFields = categorySchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const collisionCheck = await pool.query(
      "SELECT name, slug FROM categories WHERE name ILIKE $1 OR slug = $2",
      [fields.name, fields.slug],
    );

    if ((collisionCheck.rowCount ?? 0) > 0) {
      const zodErrors: Record<string, string[]> = {};

      for (const row of collisionCheck.rows) {
        if (row.name.toLowerCase() === fields.name.toLowerCase()) {
          zodErrors.name = ["El nombre ya está registrado."];
        }
        if (row.slug === fields.slug) {
          zodErrors.slug = ["El slug ya está en uso."];
        }
      }

      return {
        success: false,
        message: "Corrige los errores de duplicidad.",
        zodErrors, // Esto mostrará el error justo debajo de cada input
        data: fields,
      };
    }

    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "categories",
      "image",
    );
    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message || "Error con la imagen",
        data: fields,
      };
    }

    const { name, slug, description, status } = validatedFields.data;

    // 🔥 RETURNING id para auditar
    const query = `
      INSERT INTO categories (name, slug, description, image_url, image_key, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id
    `;
    const result = await pool.query(query, [
      name,
      slug,
      description || null,
      imageResult.url,
      imageResult.key,
      status,
    ]);

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "CREATE",
      "categories",
      result.rows[0].id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);
  } catch (error: any) {
    console.error("❌ Error en createCategoryAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
  redirect("/dashboard/categories");
}

export async function updateCategoryAction(
  prevState: ActionState<EditCategoryInput>,
  formData: FormData,
): Promise<ActionState<EditCategoryInput>> {
  const session = await requireAdminSession();
  const fields = {
    id: Number(formData.get("id")),
    name: formData.get("name")?.toString().trim() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    status: formData.get("status")?.toString() as
      | "activo"
      | "inactivo"
      | undefined,
  };
  try {
    const validatedFields = editCategorySchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { id, name, slug, description, status } = validatedFields.data;

    const collisionCheck = await pool.query(
      "SELECT id, name, slug FROM categories WHERE (name ILIKE $1 OR slug = $2) AND id != $3",
      [name, slug, id],
    );

    if ((collisionCheck.rowCount ?? 0) > 0) {
      const zodErrors: Record<string, string[]> = {};

      for (const row of collisionCheck.rows) {
        if (row.name.toLowerCase() === name.toLowerCase()) {
          zodErrors.name = ["Ya existe otra categoría con este nombre."];
        }
        if (row.slug === slug) {
          zodErrors.slug = ["Ya existe otra categoría con este slug."];
        }
      }

      return {
        success: false,
        message: "No se puede guardar: hay conflictos con otras categorías.",
        zodErrors,
        data: fields,
      };
    }

    let newImageUrl = null;
    let newImageKey = null;
    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "categories",
      "image",
    );
    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message || "Error con la imagen",
        data: fields,
      };
    }
    if (imageResult.url && imageResult.key) {
      newImageUrl = imageResult.url;
      newImageKey = imageResult.key;
      const oldBannerQuery = "SELECT image_key FROM categories WHERE id = $1";
      const oldBannerResult = await pool.query(oldBannerQuery, [fields.id]);
      const oldImageKey = oldBannerResult.rows[0]?.image_key;
      if (oldImageKey) {
        await deleteFileFromS3Action(oldImageKey);
      }
    }

    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE categories SET 
          name = $1, slug = $2, description = $3, status = $4, image_url = $5, image_key = $6, updated_at = NOW()
        WHERE id = $7
      `;
      await pool.query(query, [
        name,
        slug,
        description || null,
        status,
        newImageUrl,
        newImageKey,
        id,
      ]);
    } else {
      const query = `
        UPDATE categories SET 
          name = $1, slug = $2, description = $3, status = $4, updated_at = NOW()
        WHERE id = $5
      `;
      await pool.query(query, [name, slug, description || null, status, id]);
    }

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "UPDATE",
      "categories",
      id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(`${REVALIDATE_ROUTE}/${id}`);
    return {
      success: true,
      message: "Categoría actualizada correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en updateCategoryAction:", error.message);
    return { success: false, message: error.message || "Error al actualizar." };
  }
}

export async function toggleCategoryStatusAction(
  id: number,
  currentStatus: string,
) {
  await requireAdminSession();
  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE categories SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `Categoría ${nextStatus === "activo" ? "activada" : "desactivada"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleCategoryStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteCategoryAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // Marcamos la fecha de eliminación. La imagen queda congelada en S3 por si se restaura.
    const softDeleteQuery =
      "UPDATE categories SET deleted_at = NOW() WHERE id = $1";
    await pool.query(softDeleteQuery, [id]);

    await logAudit(adminId, "SOFT_DELETE", "categories", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Categoría movida a la papelera correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteCategoryAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo eliminar la categoría.",
    };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteCategoryAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // 1. Recuperamos el image_key antes de destruir el registro físico
    const getQuery = "SELECT image_key FROM categories WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const categoryRecord = result.rows[0];

    if (!categoryRecord) {
      return { success: false, message: "La categoría no existe." };
    }

    // 2. Borrado físico del archivo en AWS S3 usando tu lógica original
    if (categoryRecord.image_key) {
      await deleteFileFromS3Action(categoryRecord.image_key);
    }

    // 3. Borrado destructivo real de la base de datos
    const deleteQuery = "DELETE FROM categories WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    await logAudit(adminId, "HARD_DELETE", "categories", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Categoría eliminada definitivamente del sistema y de S3.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en permanentlyDeleteCategoryAction:",
      error.message,
    );
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo purgar la categoría (quizás tiene productos asociados activos).",
    };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADAS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteCategoriesAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay categorías seleccionadas." };
    }

    // Mandamos el lote a la papelera en una sola transacción rápida
    const query = "UPDATE categories SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(adminId, "BULK_SOFT_DELETE", "categories", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `${ids.length} categorías movidas a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteCategoriesAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "Error al eliminar las categorías seleccionadas.",
    };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADAS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteCategoriesAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay categorías seleccionadas." };
    }

    // 1. Buscamos todas las imágenes del lote en paralelo
    const getQuery = "SELECT image_key FROM categories WHERE id = ANY($1)";
    const result = await pool.query(getQuery, [ids]);

    // 2. Limpiamos AWS S3 iterando las claves devueltas
    for (const row of result.rows) {
      if (row.image_key) {
        await deleteFileFromS3Action(row.image_key);
      }
    }

    // 3. Remoción física de los registros correspondientes
    const deleteQuery = "DELETE FROM categories WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    await logAudit(adminId, "BULK_HARD_DELETE", "categories", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Las categorías seleccionadas se eliminaron permanentemente.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteCategoriesAction:",
      error.message,
    );
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudieron purgar las categorías seleccionadas (revisa dependencias de productos).",
    };
  }
}

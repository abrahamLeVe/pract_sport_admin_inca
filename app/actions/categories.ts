"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  categorySchema,
  editCategorySchema,
  FormCategoryState,
} from "@/validations/categories";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action, uploadFileToS3Action } from "./storage";

export async function createCategoryAction(
  prevState: FormCategoryState,
  formData: FormData,
): Promise<FormCategoryState> {
  try {
    await requireAdminSession();

    // 1. Rescatamos los campos escritos por el usuario
    const fields = {
      name: formData.get("name")?.toString() || "",
      slug: formData.get("slug")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      status: formData.get("status")?.toString() || "activo",
    };

    // 2. Validamos con Zod
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

    // 3. Verificamos que el SLUG no exista ya en la base de datos
    const slugCheck = await pool.query(
      "SELECT id FROM categories WHERE slug = $1",
      [validatedFields.data.slug],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está en uso. Por favor, elige otro.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };
    }

    // 4. Manejo de la Imagen (A diferencia de banners, aquí la imagen suele ser OPCIONAL)
    const imageFile = formData.get("image") as File;
    let imageUrl = null;
    let imageKey = null;

    if (imageFile && imageFile.size > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        return {
          success: false,
          message: "Formato no permitido. Solo JPG, PNG o WEBP.",
          data: fields,
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera el límite de 5MB.",
          data: fields,
        };
      }

      const s3Result = await uploadFileToS3Action(imageFile, "categories");
      if (!s3Result.success || !s3Result.key || !s3Result.url) {
        throw new Error(s3Result.message || "Error al subir la imagen a S3.");
      }
      imageUrl = s3Result.url;
      imageKey = s3Result.key;
    }

    const { name, slug, description, status } = validatedFields.data;

    const query = `
      INSERT INTO categories (
        name, slug, description, image_url, image_key, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [
      name,
      slug,
      description || null,
      imageUrl,
      imageKey,
      status,
    ]);

    revalidatePath("/dashboard/categories");
  } catch (error: any) {
    console.error("❌ Error en createCategoryAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
    };
  }

  redirect("/dashboard/categories");
}

export async function updateCategoryAction(
  prevState: FormCategoryState,
  formData: FormData,
): Promise<FormCategoryState> {
  try {
    await requireAdminSession();

    const rawFormData = {
      id: formData.get("id")?.toString() || "",
      name: formData.get("name")?.toString() || "",
      slug: formData.get("slug")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      status: formData.get("status")?.toString() || "activo",
    };

    const validatedFields = editCategorySchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: validatedFields.error.flatten().fieldErrors as any,
        data: rawFormData,
      };
    }

    const { id, name, slug, description, status } = validatedFields.data;

    // Verificar que el nuevo SLUG no pertenezca a OTRA categoría
    const slugCheck = await pool.query(
      "SELECT id FROM categories WHERE slug = $1 AND id != $2",
      [slug, id],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está siendo usado por otra categoría.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: rawFormData,
      };
    }

    const imageFile = formData.get("image") as File;
    let newImageUrl = null;
    let newImageKey = null;

    if (imageFile && imageFile.size > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        return {
          success: false,
          message: "Formato no permitido.",
          data: rawFormData,
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera 5MB.",
          data: rawFormData,
        };
      }

      // 🔥 LIMPIEZA S3: Buscar imagen vieja
      const oldCategoryResult = await pool.query(
        "SELECT image_key FROM categories WHERE id = $1",
        [id],
      );
      const oldImageKey = oldCategoryResult.rows[0]?.image_key;

      const s3Result = await uploadFileToS3Action(imageFile, "categories");
      if (s3Result.success) {
        newImageUrl = s3Result.url;
        newImageKey = s3Result.key;

        // 🔥 Destruir la vieja
        if (oldImageKey) await deleteFileFromS3Action(oldImageKey);
      } else {
        throw new Error(s3Result.message || "Error al subir la nueva imagen.");
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

    revalidatePath("/dashboard/categories");
  } catch (error: any) {
    console.error("❌ Error en updateCategoryAction:", error.message);
    return { success: false, message: error.message || "Error al actualizar." };
  }

  redirect("/dashboard/categories");
}

export async function deleteCategoryAction(id: number) {
  try {
    await requireAdminSession();

    const getQuery = "SELECT image_key FROM categories WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const category = result.rows[0];

    if (!category)
      return { success: false, message: "La categoría no existe." };

    if (category.image_key) {
      await deleteFileFromS3Action(category.image_key);
    }

    const deleteQuery = "DELETE FROM categories WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    revalidatePath("/dashboard/categories");
    return { success: true, message: "Categoría eliminada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteCategoryAction:", error.message);
    return {
      success: false,
      message:
        "No se pudo eliminar la categoría (quizás tiene productos asociados).",
    };
  }
}

export async function toggleCategoryStatusAction(
  id: number,
  currentStatus: string,
) {
  try {
    await requireAdminSession();
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE categories SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

    revalidatePath("/dashboard/categories");
    return {
      success: true,
      message: `Categoría ${nextStatus === "activo" ? "activada" : "desactivada"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleCategoryStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

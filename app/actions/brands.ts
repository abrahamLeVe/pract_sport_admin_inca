"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  BrandInput,
  brandSchema,
  EditBrandInput,
  editBrandSchema,
} from "@/validations/brands";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action, uploadFileToS3Action } from "./storage";
import { handleImageUpload } from "@/lib/upload";
import { ActionState } from "@/validations/core";

export async function createBrandAction(
  prevState: ActionState<BrandInput>,
  formData: FormData,
): Promise<ActionState<BrandInput>> {
  await requireAdminSession();
  const fields = {
    name: formData.get("name")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    status: formData.get("status")?.toString() as
      | "activo"
      | "inactivo"
      | undefined,
  };

  try {
    const validatedFields = brandSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const slugCheck = await pool.query(
      "SELECT id FROM brands WHERE slug = $1",
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

    const imageResult = await handleImageUpload(formData, "image", "brands");

    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message || "Error con la imagen",
        data: fields,
      };
    }

    const imageUrl = imageResult.url;
    const imageKey = imageResult.key;

    const { name, slug, description, status } = validatedFields.data;

    const query = `
      INSERT INTO brands (
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

    revalidatePath("/dashboard/brands");
  } catch (error: any) {
    console.error("❌ Error en createBrandAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
      data: fields,
    };
  }

  redirect("/dashboard/brands");
}

export async function updateBrandAction(
  prevState: ActionState<EditBrandInput>,
  formData: FormData,
): Promise<ActionState<EditBrandInput>> {
  await requireAdminSession();
  const fields = {
    id: Number(formData.get("id")),
    name: formData.get("name")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    status: formData.get("status")?.toString() as
      | "activo"
      | "inactivo"
      | undefined,
  };

  try {
    const validatedFields = editBrandSchema.safeParse(fields);

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

    const slugCheck = await pool.query(
      "SELECT id FROM brands WHERE slug = $1 AND id != $2",
      [slug, id],
    );
    if ((slugCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este Slug ya está siendo usado por otra marca.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };
    }

    let newImageUrl = null;
    let newImageKey = null;
    const imageResult = await handleImageUpload(formData, "image", "brands");
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
      const oldBannerQuery = "SELECT image_key FROM brands WHERE id = $1";
      const oldBannerResult = await pool.query(oldBannerQuery, [fields.id]);
      const oldImageKey = oldBannerResult.rows[0]?.image_key;
      if (oldImageKey) {
        await deleteFileFromS3Action(oldImageKey);
      }
    }
    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE brands SET 
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
        UPDATE brands SET 
          name = $1, slug = $2, description = $3, status = $4, updated_at = NOW()
        WHERE id = $5
      `;
      await pool.query(query, [name, slug, description || null, status, id]);
    }

    revalidatePath("/dashboard/brands");
  } catch (error: any) {
    console.error("❌ Error en updateBrandAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }

  redirect("/dashboard/brands");
}

export async function deleteBrandAction(id: number) {
  await requireAdminSession();
  try {
    const getQuery = "SELECT image_key FROM brands WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const brand = result.rows[0];

    if (!brand) return { success: false, message: "La marca no existe." };

    if (brand.image_key) {
      await deleteFileFromS3Action(brand.image_key);
    }

    const deleteQuery = "DELETE FROM brands WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    revalidatePath("/dashboard/brands");
    return { success: true, message: "Marca eliminada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteBrandAction:", error.message);
    return {
      success: false,
      message:
        "No se pudo eliminar la marca (quizás tiene productos asociados).",
    };
  }
}

export async function toggleBrandStatusAction(
  id: number,
  currentStatus: string,
) {
  await requireAdminSession();

  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE brands SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

    revalidatePath("/dashboard/brands");
    return {
      success: true,
      message: `Marca ${nextStatus === "activo" ? "activada" : "desactivada"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleBrandStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

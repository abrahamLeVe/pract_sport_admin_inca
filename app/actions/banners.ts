"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  bannerSchema,
  editBannerSchema,
  FormBannerState,
} from "@/validations/banners";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action, uploadFileToS3Action } from "./storage";

export async function createBannerAction(
  prevState: FormBannerState,
  formData: FormData,
): Promise<FormBannerState> {
  try {
    await requireAdminSession();

    const fields = {
      title: formData.get("title")?.toString() || "",
      subtitle: formData.get("subtitle")?.toString() || "",
      link_url: formData.get("link_url")?.toString() || "",
      type: formData.get("type")?.toString() || "general",
      status: formData.get("status")?.toString() || "activo",
      start_date: formData.get("start_date")?.toString() || undefined,
      end_date: formData.get("end_date")?.toString() || undefined,
      sort_order: 0,
    };

    const imageFile = formData.get("image") as File;

    if (!imageFile || imageFile.size === 0) {
      return {
        success: false,
        message: "La imagen del banner es obligatoria.",
        zodErrors: {
          image: ["Debes seleccionar un archivo de imagen válido."],
        } as any,
        data: fields,
      };
    }
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(imageFile.type)) {
      return {
        success: false,
        message: "Formato no permitido. Solo JPG, PNG o WEBP.",
        zodErrors: { image: ["El archivo debe ser una imagen."] } as any,
        data: fields,
      };
    }
    if (imageFile.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: "La imagen supera el límite de 5MB.",
        zodErrors: { image: ["El archivo es demasiado pesado."] } as any,
        data: fields,
      };
    }

    const validatedFields = bannerSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const s3Result = await uploadFileToS3Action(imageFile, "banners");
    if (!s3Result.success || !s3Result.key || !s3Result.url) {
      throw new Error(s3Result.message || "Error al subir la imagen a S3.");
    }

    const {
      title,
      subtitle,
      link_url,
      type,
      sort_order,
      status,
      start_date,
      end_date,
    } = validatedFields.data;

    const query = `
      INSERT INTO banners (
        title, subtitle, image_url, image_key, link_url, type, sort_order, status, start_date, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await pool.query(query, [
      title,
      subtitle || null,
      s3Result.url,
      s3Result.key,
      link_url || null,
      type,
      sort_order, // Entra siempre como 0
      status,
      start_date ? new Date(start_date) : null,
      end_date ? new Date(end_date) : null,
    ]);

    revalidatePath("/dashboard/banners");
  } catch (error: any) {
    console.error("❌ Error en createBannerAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
    };
  }

  redirect("/dashboard/banners");
}

export async function updateBannerAction(
  prevState: FormBannerState,
  formData: FormData,
): Promise<FormBannerState> {
  try {
    await requireAdminSession();

    const rawFormData = {
      id: formData.get("id")?.toString() || "",
      title: formData.get("title")?.toString() || "",
      subtitle: formData.get("subtitle")?.toString() || "",
      link_url: formData.get("link_url")?.toString() || "",
      type: formData.get("type")?.toString() || "general",
      sort_order: formData.get("sort_order")?.toString() || "0",
      status: formData.get("status")?.toString() || "activo",
      start_date: formData.get("start_date")?.toString() || undefined,
      end_date: formData.get("end_date")?.toString() || undefined,
    };

    const imageFile = formData.get("image") as File;
    let newImageUrl = null;
    let newImageKey = null;

    if (imageFile && imageFile.size > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        return {
          success: false,
          message: "Formato no permitido. Solo JPG, PNG o WEBP.",
          zodErrors: { image: ["El archivo debe ser una imagen."] } as any,
          data: rawFormData,
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera el límite de 5MB.",
          zodErrors: { image: ["El archivo es demasiado pesado."] } as any,
          data: rawFormData,
        };
      }

      const oldBannerQuery = "SELECT image_key FROM banners WHERE id = $1";
      const oldBannerResult = await pool.query(oldBannerQuery, [
        rawFormData.id,
      ]);
      const oldImageKey = oldBannerResult.rows[0]?.image_key;

      const s3Result = await uploadFileToS3Action(imageFile, "banners");

      if (s3Result.success) {
        newImageUrl = s3Result.url;
        newImageKey = s3Result.key;

        if (oldImageKey) {
          await deleteFileFromS3Action(oldImageKey);
        }
      } else {
        throw new Error(s3Result.message || "Error al subir la nueva imagen.");
      }
    }

    const validatedFields = editBannerSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: validatedFields.error.flatten().fieldErrors as any,
        data: rawFormData,
      };
    }

    const {
      id,
      title,
      subtitle,
      link_url,
      type,
      sort_order,
      status,
      start_date,
      end_date,
    } = validatedFields.data;

    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE banners SET 
          title = $1, subtitle = $2, link_url = $3, type = $4, sort_order = $5, 
          status = $6, start_date = $7, end_date = $8, image_url = $9, image_key = $10, updated_at = NOW()
        WHERE id = $11
      `;
      await pool.query(query, [
        title,
        subtitle || null,
        link_url || null,
        type,
        sort_order,
        status,
        start_date ? new Date(start_date) : null,
        end_date ? new Date(end_date) : null,
        newImageUrl,
        newImageKey,
        id,
      ]);
    } else {
      const query = `
        UPDATE banners SET 
          title = $1, subtitle = $2, link_url = $3, type = $4, sort_order = $5, 
          status = $6, start_date = $7, end_date = $8, updated_at = NOW()
        WHERE id = $9
      `;
      await pool.query(query, [
        title,
        subtitle || null,
        link_url || null,
        type,
        sort_order,
        status,
        start_date ? new Date(start_date) : null,
        end_date ? new Date(end_date) : null,
        id,
      ]);
    }

    revalidatePath("/dashboard/banners");
  } catch (error: any) {
    console.error("❌ Error en updateBannerAction:", error.message);
    return { success: false, message: error.message || "Error al actualizar." };
  }

  redirect("/dashboard/banners");
}

export async function deleteBannerAction(id: number) {
  try {
    await requireAdminSession();

    const getQuery = "SELECT image_key FROM banners WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const banner = result.rows[0];

    if (!banner) {
      return { success: false, message: "El banner no existe." };
    }

    if (banner.image_key) {
      await deleteFileFromS3Action(banner.image_key);
    }

    const deleteQuery = "DELETE FROM banners WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    revalidatePath("/dashboard/banners");

    return { success: true, message: "Banner eliminado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteBannerAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error al eliminar el banner.",
    };
  }
}

export async function toggleBannerStatusAction(
  id: number,
  currentStatus: string,
) {
  try {
    await requireAdminSession();

    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `
      UPDATE banners 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    await pool.query(query, [nextStatus, id]);

    revalidatePath("/dashboard/banners");

    return {
      success: true,
      message: `Banner ${nextStatus === "activo" ? "activado" : "desactivado"} correctamente.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleBannerStatusAction:", error);
    return {
      success: false,
      message: "No se pudo cambiar el estado del banner.",
    };
  }
}

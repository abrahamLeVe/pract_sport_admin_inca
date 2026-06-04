"use server";

import { bannerSchema, FormBannerState } from "@/validations/banners";
import { uploadFileToS3Action } from "./storage";
import { requireAdminSession } from "@/lib/auth-guard";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import pool from "@/lib/db";
import z from "zod";

export async function createBannerAction(
  prevState: FormBannerState,
  formData: FormData,
): Promise<FormBannerState> {
  try {
    await requireAdminSession();

    const imageFile = formData.get("image") as File;
    if (!imageFile || imageFile.size === 0) {
      return {
        success: false,
        message: "La imagen del banner es obligatoria.",
        zodErrors: {
          image: ["Debes seleccionar un archivo de imagen válido."],
        } as any,
      };
    }

    const fields = {
      title: formData.get("title"),
      subtitle: formData.get("subtitle"),
      link_url: formData.get("link_url"),
      type: formData.get("type"),
      sort_order: formData.get("sort_order"),
      status: formData.get("status"),
      start_date: formData.get("start_date") || undefined,
      end_date: formData.get("end_date") || undefined,
    };

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

    // 4. Subimos la imagen de forma limpia a S3 en una subcarpeta dedicada
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
      s3Result.url, // URL de visualización masiva para la web del cliente
      s3Result.key, // Key único para cuando toque borrar el archivo de la nube
      link_url || null,
      type,
      sort_order,
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

"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { handleImageUpload } from "@/lib/upload";
import {
  BannerInput,
  bannerSchema,
  EditBannerInput,
  editBannerSchema,
} from "@/validations/banners";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action } from "./storage";

export async function createBannerAction(
  prevState: ActionState<BannerInput>,
  formData: FormData,
): Promise<ActionState<BannerInput>> {
  await requireAdminSession();
  const rawEventId = formData.get("event_id")?.toString();
  const eventIdNum =
    rawEventId && rawEventId !== "none" ? parseInt(rawEventId, 10) : null;
  const fields: BannerInput = {
    title: formData.get("title")?.toString() || "",
    subtitle: formData.get("subtitle")?.toString() || "",
    link_url: formData.get("link_url")?.toString() || "",
    type:
      (formData.get("type") as "general" | "oferta" | "evento" | "novedad") ||
      "general",
    status: formData.get("status") as "activo" | "inactivo",
    start_date: formData.get("start_date")?.toString() || undefined,
    end_date: formData.get("end_date")?.toString() || undefined,
    event_id: eventIdNum,
    sort_order: 0,
  };
  try {
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
    const imageResult = await handleImageUpload(formData, "image", "banners");
    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message,
        data: fields,
      };
    }
    const imageUrl = imageResult.url;
    const imageKey = imageResult.key;
    const {
      title,
      subtitle,
      link_url,
      type,
      sort_order,
      status,
      start_date,
      event_id,
      end_date,
    } = validatedFields.data;
    const query = `
      INSERT INTO banners (
        title, subtitle, image_url, image_key, link_url, type, sort_order, status, start_date, event_id, end_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
    `;
    await pool.query(query, [
      title,
      subtitle || null,
      imageUrl,
      imageKey,
      link_url || null,
      type,
      sort_order,
      status,
      start_date ? new Date(start_date) : null,
      event_id,
      end_date ? new Date(end_date) : null,
    ]);
    revalidatePath("/dashboard/banners");
  } catch (error: any) {
    console.error("❌ Error en createBannerAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
      data: fields,
    };
  }
  redirect("/dashboard/banners");
}

export async function updateBannerAction(
  prevState: ActionState<EditBannerInput>,
  formData: FormData,
): Promise<ActionState<EditBannerInput>> {
  await requireAdminSession();
  const rawId = formData.get("id")?.toString();
  const numericId = rawId ? parseInt(rawId, 10) : 0;
  const rawEventId = formData.get("event_id")?.toString();
  const eventIdNum =
    rawEventId && rawEventId !== "none" ? parseInt(rawEventId, 10) : null;
  const rawSortOrder = formData.get("sort_order")?.toString();
  const sortOrderNum = rawSortOrder ? parseInt(rawSortOrder, 10) : 0;
  const fields: EditBannerInput = {
    id: numericId,
    title: formData.get("title")?.toString() || "",
    subtitle: formData.get("subtitle")?.toString() || "",
    link_url: formData.get("link_url")?.toString() || "",
    type:
      (formData.get("type") as "general" | "oferta" | "evento" | "novedad") ||
      "general",
    sort_order: sortOrderNum,
    status: formData.get("status") as "activo" | "inactivo",
    start_date: formData.get("start_date")?.toString() || "",
    end_date: formData.get("end_date")?.toString() || "",
    event_id: eventIdNum,
  };
  try {
    let newImageUrl = null;
    let newImageKey = null;
    const imageResult = await handleImageUpload(formData, "image", "banners");
    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message,
        zodErrors: {
          image: [imageResult.message || "Error con la imagen"],
        } as any,
        data: fields,
      };
    }
    if (imageResult.url && imageResult.key) {
      newImageUrl = imageResult.url;
      newImageKey = imageResult.key;
      const oldBannerQuery = "SELECT image_key FROM banners WHERE id = $1";
      const oldBannerResult = await pool.query(oldBannerQuery, [fields.id]);
      const oldImageKey = oldBannerResult.rows[0]?.image_key;
      if (oldImageKey) {
        await deleteFileFromS3Action(oldImageKey);
      }
    }
    const validatedFields = editBannerSchema.safeParse(fields);
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
      title,
      subtitle,
      link_url,
      type,
      sort_order,
      status,
      start_date,
      end_date,
      event_id,
    } = validatedFields.data;
    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE banners SET 
          title = $1, subtitle = $2, link_url = $3, type = $4, sort_order = $5, 
          status = $6, event_id = $7, start_date = $8, end_date = $9, image_url = $10, image_key = $11, updated_at = NOW()
        WHERE id = $12
      `;
      await pool.query(query, [
        title,
        subtitle || null,
        link_url || null,
        type,
        sort_order,
        status,
        event_id,
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
          status = $6, event_id = $7, start_date = $8, end_date = $9, updated_at = NOW()
        WHERE id = $10
      `;
      await pool.query(query, [
        title,
        subtitle || null,
        link_url || null,
        type,
        sort_order,
        status,
        event_id,
        start_date ? new Date(start_date) : null,
        end_date ? new Date(end_date) : null,
        id,
      ]);
    }
    revalidatePath("/dashboard/banners");
  } catch (error: any) {
    console.error("❌ Error en updateBannerAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }
  redirect("/dashboard/banners");
}

export async function deleteBannerAction(id: number) {
  await requireAdminSession();
  try {
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
): Promise<ActionState> {
  await requireAdminSession();
  try {
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

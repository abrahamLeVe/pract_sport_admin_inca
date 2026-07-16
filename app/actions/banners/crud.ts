"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { handleMediaUpload } from "@/lib/upload";
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
import { deleteFileFromS3Action } from "../storage";
import { logAudit } from "@/lib/data/audit";
const REVALIDATE_ROUTE = "/dashboard/banners";

export async function createBannerAction(
  prevState: ActionState<BannerInput>,
  formData: FormData,
): Promise<ActionState<BannerInput>> {
  const session = await requireAdminSession();

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
    event_id: Number(formData.get("event_id")) || undefined,
    sort_order: 0,
  };

  try {
    const validatedFields = bannerSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "banners",
      "image",
      true,
    );
    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message,
        zodErrors: { image: [imageResult.message || "Se requiere imagen"] },
        data: fields,
      };
    }

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

    // 🔥 RETURNING id para auditoría
    const query = `
      INSERT INTO banners (title, subtitle, image_url, image_key, link_url, type, sort_order, status, start_date, event_id, end_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;
    const result = await pool.query(query, [
      title,
      subtitle || null,
      imageResult.url,
      imageResult.key,
      link_url || null,
      type,
      sort_order,
      status,
      start_date ? new Date(start_date) : null,
      event_id,
      end_date ? new Date(end_date) : null,
    ]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "CREATE",
      "banners",
      result.rows[0].id,
      null, // 🔥 old_data
      validatedFields.data, // 🔥 new_data
    );

    revalidatePath(REVALIDATE_ROUTE);
  } catch (error: any) {
    console.error("❌ Error en createBannerAction:", error.message);
    return {
      success: false,
      message: error.message || "Error inesperado.",
      data: fields,
    };
  }
  redirect("/dashboard/banners");
}

export async function updateBannerAction(
  prevState: ActionState<EditBannerInput>,
  formData: FormData,
): Promise<ActionState<EditBannerInput>> {
  const session = await requireAdminSession();

  const fields: EditBannerInput = {
    id: Number(formData.get("id")) || 0,
    title: (formData.get("title") as string) || "",
    subtitle: (formData.get("subtitle") as string) || "",
    link_url: (formData.get("link_url") as string) || "",
    type:
      (formData.get("type") as "general" | "oferta" | "evento" | "novedad") ||
      "general",
    sort_order: Number(formData.get("sort_order")) || 0,
    status: formData.get("status") as "activo" | "inactivo",
    start_date: (formData.get("start_date") as string) || "",
    end_date: (formData.get("end_date") as string) || "",
    event_id: Number(formData.get("event_id")) || undefined,
  };
  try {
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

    // ========================================================================
    // 🔥 PASO 1: LA BARRERA DE SEGURIDAD (Mirar antes de saltar)
    // ========================================================================
    const checkResult = await pool.query(
      "SELECT image_key FROM banners WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    if (checkResult.rowCount === 0)
      return {
        success: false,
        message: "Banner no encontrado o eliminado.",
        data: fields,
      };
    const oldData = checkResult.rows[0]; // 📸 Capturamos cómo estaba antes
    const oldImageKey = oldData.image_key; // Sacamos la llave de la imagen

    // ========================================================================
    // PASO 2: PROCESAR LA IMAGEN EN S3 (Solo llega aquí si el banner es válido)
    // ========================================================================
    let newImageUrl = null;
    let newImageKey = null;
    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "banners",
      "image",
      false,
    );

    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message,
        zodErrors: { image: [imageResult.message || "Se requiere imagen"] },
        data: fields,
      };
    }

    if (imageResult.url && imageResult.key) {
      newImageUrl = imageResult.url;
      newImageKey = imageResult.key;

      // Borramos la imagen antigua usando la llave que sacamos en el PASO 1
      if (oldImageKey) {
        await deleteFileFromS3Action(oldImageKey);
      }
    }

    // ========================================================================
    // PASO 3: ACTUALIZAR LA BASE DE DATOS
    // ========================================================================
    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE banners SET 
          title = $1, subtitle = $2, link_url = $3, type = $4, sort_order = $5, 
          status = $6, event_id = $7, start_date = $8, end_date = $9, image_url = $10, image_key = $11, updated_at = NOW()
        WHERE id = $12 AND deleted_at IS NULL
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
        WHERE id = $10 AND deleted_at IS NULL 
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
    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "UPDATE",
      "banners",
      id,
      oldData, // 🔥 old_data
      validatedFields.data, // 🔥 new_data
    );
    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(`${REVALIDATE_ROUTE}/${id}`);
    return {
      success: true,
      message: "Banner actualizado correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en updateBannerAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }
}

export async function toggleBannerStatusAction(
  id: number,
  currentStatus: string,
): Promise<ActionState> {
  const session = await requireAdminSession();
  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE banners SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`;
    const result = await pool.query(query, [nextStatus, id]);

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "No se pudo actualizar porque no existe o está eliminado.",
      };
    }

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "UPDATE",
      "banners",
      id,
      { status: currentStatus }, // 🔥 old_data
      { status: nextStatus }, // 🔥 new_data
    );

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `Estado cambiado a ${nextStatus} correctamente.`,
    };
  } catch (error: any) {
    console.error("❌ Error al cambiar estado:", error.message);
    return { success: false, message: "Error en el servidor." };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteBannerAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // Marcamos la fecha de eliminación. El archivo físico sigue en S3 por si se restaura.
    const softDeleteQuery =
      "UPDATE banners SET deleted_at = NOW() WHERE id = $1";
    await pool.query(softDeleteQuery, [id]);

    // 📋 AUDITORÍA
    await logAudit(
      adminId,
      "SOFT_DELETE",
      "banners",
      id,
      { deleted_at: null }, // 🔥 old_data
      { deleted_at: new Date().toISOString() }, // 🔥 new_data
    );

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Banner movido a la papelera correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteBannerAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo eliminar el banner.",
    };
  }
}

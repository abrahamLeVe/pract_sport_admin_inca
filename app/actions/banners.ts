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
import { deleteFileFromS3Action } from "./storage";
import { logAudit } from "@/lib/data/audit";
const REVALIDATE_ROUTE = "/dashboard/banners";

export async function createBannerAction(
  prevState: ActionState<BannerInput>,
  formData: FormData,
): Promise<ActionState<BannerInput>> {
  const session = await requireAdminSession();

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
      return { success: false, message: imageResult.message, data: fields };
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
      null,
      validatedFields.data,
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
    const oldImageKey = checkResult.rows[0].image_key;

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
        message: imageResult.message || "Error con la imagen",
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
      null,
      validatedFields.data,
    );
    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Banner actualizado correctamente." }; // Asegúrate de retornar éxito
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
    await logAudit(session.user.id, "UPDATE", "banners", id, null, {
      status: nextStatus,
    });

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

    await logAudit(adminId, "SOFT_DELETE", "banners", id);

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

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteBannerAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // 1. Recuperamos el image_key del banner antes de destruir el registro
    const getQuery = "SELECT image_key FROM banners WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const bannerRecord = result.rows[0];

    if (!bannerRecord) {
      return { success: false, message: "El banner no existe." };
    }

    // 2. Borrado físico de la imagen en AWS S3 para liberar espacio
    if (bannerRecord.image_key) {
      await deleteFileFromS3Action(bannerRecord.image_key);
    }

    // 3. Borrado destructivo real de la base de datos
    const deleteQuery = "DELETE FROM banners WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    await logAudit(adminId, "HARD_DELETE", "banners", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Banner eliminado definitivamente del sistema y de S3.",
    };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteBannerAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo purgar el banner.",
    };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteBannersAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay banners seleccionados." };
    }

    // Actualizamos el lote completo hacia la papelera en un solo query rápido
    const query = "UPDATE banners SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(adminId, "BULK_SOFT_DELETE", "banners", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `${ids.length} banners movidos a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteBannersAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "Error al eliminar los banners seleccionados.",
    };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteBannersAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay banners seleccionados." };
    }

    // 1. Buscamos todas las imágenes del lote en un único query
    const getQuery = "SELECT image_key FROM banners WHERE id = ANY($1)";
    const result = await pool.query(getQuery, [ids]);

    // 2. barremos los registros limpiando las imágenes almacenadas en S3
    for (const row of result.rows) {
      if (row.image_key) {
        await deleteFileFromS3Action(row.image_key);
      }
    }

    // 3. Remoción física de los registros correspondientes
    const deleteQuery = "DELETE FROM banners WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    await logAudit(adminId, "BULK_HARD_DELETE", "banners", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Los banners seleccionados se eliminaron permanentemente.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteBannersAction:",
      error.message,
    );
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudieron purgar los banners seleccionados.",
    };
  }
}

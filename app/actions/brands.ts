"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { handleMediaUpload } from "@/lib/upload";
import {
  BrandInput,
  brandSchema,
  EditBrandInput,
  editBrandSchema,
} from "@/validations/brands";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action } from "./storage";
import { logAudit } from "@/lib/data/audit";

const REVALIDATE_ROUTE = "/dashboard/brands";

export async function createBrandAction(
  prevState: ActionState<BrandInput>,
  formData: FormData,
): Promise<ActionState<BrandInput>> {
  const session = await requireAdminSession();
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
        message: "Por favor, corrige los errores.",
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
        message: "Este Slug ya está en uso.",
        zodErrors: { slug: ["El slug ya existe."] },
        data: fields,
      };
    }

    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "brands",
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

    // 🔥 RETURNING id para poder auditar
    const query = `
      INSERT INTO brands (name, slug, description, image_url, image_key, status) 
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

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "CREATE",
      "brands",
      result.rows[0].id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);
  } catch (error: any) {
    console.error("❌ Error en createBrandAction:", error.message);
    return { success: false, message: "Error inesperado.", data: fields };
  }

  redirect("/dashboard/brands");
}

export async function updateBrandAction(
  prevState: ActionState<EditBrandInput>,
  formData: FormData,
): Promise<ActionState<EditBrandInput>> {
  const session = await requireAdminSession();
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

    // 0. Comprobar Slug (Permite reutilizar slugs de marcas en la papelera)
    const slugCheck = await pool.query(
      "SELECT id FROM brands WHERE slug = $1 AND id != $2 AND deleted_at IS NULL",
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

    // ========================================================================
    // 🔥 PASO 1: LA BARRERA DE SEGURIDAD (Mirar antes de saltar)
    // ========================================================================
    const checkQuery =
      "SELECT image_key FROM brands WHERE id = $1 AND deleted_at IS NULL";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rowCount === 0) {
      return {
        success: false,
        message:
          "❌ La marca no se pudo actualizar porque no existe o está en la papelera.",
        data: fields,
      };
    }

    const oldImageKey = checkResult.rows[0].image_key;

    // ========================================================================
    // PASO 2: PROCESAR LA IMAGEN EN S3
    // ========================================================================
    let newImageUrl = null;
    let newImageKey = null;

    // Asumo que tu handleMediaUpload requiere el 4to parámetro booleano como en banners, si no, quítaselo.
    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "brands",
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

      // Borramos la imagen antigua usando la llave de la barrera de seguridad
      if (oldImageKey) {
        await deleteFileFromS3Action(oldImageKey);
      }
    }

    // ========================================================================
    // PASO 3: ACTUALIZAR LA BASE DE DATOS
    // ========================================================================
    if (newImageUrl && newImageKey) {
      await pool.query(
        `UPDATE brands SET name=$1, slug=$2, description=$3, status=$4, image_url=$5, image_key=$6, updated_at=NOW() WHERE id=$7 AND deleted_at IS NULL`,
        [name, slug, description || null, status, newImageUrl, newImageKey, id],
      );
    } else {
      await pool.query(
        `UPDATE brands SET name=$1, slug=$2, description=$3, status=$4, updated_at=NOW() WHERE id=$5 AND deleted_at IS NULL`,
        [name, slug, description || null, status, id],
      );
    }

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "UPDATE",
      "brands",
      id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);
  } catch (error: any) {
    console.error("❌ Error en updateBrandAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }

  // Next.js: redirect debe ir SIEMPRE fuera del try/catch si queremos que funcione bien
  redirect("/dashboard/brands");
}

export async function toggleBrandStatusAction(
  id: number,
  currentStatus: string,
) {
  const session = await requireAdminSession();

  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `UPDATE brands SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`;
    const result = await pool.query(query, [nextStatus, id]);

    if (result.rowCount === 0) {
      return {
        success: false,
        message: "No se pudo actualizar (no existe o está eliminada).",
      };
    }

    // 📋 AUDITORÍA
    await logAudit(session.user.id, "UPDATE", "brands", id, null, {
      status: nextStatus,
    });

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `Marca ${nextStatus === "activo" ? "activada" : "desactivada"}.`,
    };
  } catch (error: any) {
    console.error("❌ Error en toggleBrandStatusAction:", error.message);
    return { success: false, message: "Error en el servidor." };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteBrandAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // Marcamos la fecha de eliminación de la marca sin alterar S3
    const softDeleteQuery =
      "UPDATE brands SET deleted_at = NOW() WHERE id = $1";
    await pool.query(softDeleteQuery, [id]);

    await logAudit(adminId, "SOFT_DELETE", "brands", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Marca movida a la papelera correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteBrandAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo eliminar la marca.",
    };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteBrandAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // 1. Recuperamos el image_key del logo antes de destruir el registro
    const getQuery = "SELECT image_key FROM brands WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const brandRecord = result.rows[0];

    if (!brandRecord) {
      return { success: false, message: "La marca no existe." };
    }

    // 2. Borrado físico del logotipo en AWS S3 para liberar almacenamiento
    if (brandRecord.image_key) {
      await deleteFileFromS3Action(brandRecord.image_key);
    }

    // 3. Borrado destructivo real de la base de datos
    const deleteQuery = "DELETE FROM brands WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    await logAudit(adminId, "HARD_DELETE", "brands", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Marca eliminada definitivamente del sistema y de S3.",
    };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteBrandAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo purgar la marca.",
    };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteBrandsAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay marcas seleccionadas." };
    }

    // Mandamos el lote completo a la papelera con la directiva ANY
    const query = "UPDATE brands SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(adminId, "BULK_SOFT_DELETE", "brands", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `${ids.length} marcas movidas a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteBrandsAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "Error al eliminar las marcas seleccionadas.",
    };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteBrandsAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay marcas seleccionadas." };
    }

    // 1. Buscamos todas las imágenes del lote en un solo query
    const getQuery = "SELECT image_key FROM brands WHERE id = ANY($1)";
    const result = await pool.query(getQuery, [ids]);

    // 2. Limpiamos AWS S3 iterando los keys devueltos
    for (const row of result.rows) {
      if (row.image_key) {
        await deleteFileFromS3Action(row.image_key);
      }
    }

    // 3. Remoción final de los registros físicos
    const deleteQuery = "DELETE FROM brands WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    await logAudit(adminId, "BULK_HARD_DELETE", "brands", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Las marcas seleccionadas se eliminaron permanentemente.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteBrandsAction:",
      error.message,
    );
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudieron purgar las marcas seleccionadas.",
    };
  }
}

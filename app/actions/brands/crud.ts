"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
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
import { deleteFileFromS3Action } from "../storage";

const REVALIDATE_ROUTE = "/dashboard/brands";

export async function createBrandAction(
  prevState: ActionState<BrandInput>,
  formData: FormData,
): Promise<ActionState<BrandInput>> {
  const session = await requireAdminSession();
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

    const collisionCheck = await pool.query(
      "SELECT name, slug FROM brands WHERE name ILIKE $1 OR slug = $2",
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
      null, // 🔥 old_data: null
      validatedFields.data, // 🔥 new_data: los datos creados
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
    name: formData.get("name")?.toString().trim() || "",
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

    const collisionCheck = await pool.query(
      "SELECT id, name, slug FROM brands WHERE (name ILIKE $1 OR slug = $2) AND id != $3",
      [name, slug, id],
    );

    if ((collisionCheck.rowCount ?? 0) > 0) {
      const zodErrors: Record<string, string[]> = {};

      for (const row of collisionCheck.rows) {
        if (row.name.toLowerCase() === name.toLowerCase()) {
          zodErrors.name = ["Ya existe otra marca con este nombre."];
        }
        if (row.slug === slug) {
          zodErrors.slug = ["Ya existe otra marca con este slug."];
        }
      }

      return {
        success: false,
        message: "No se puede guardar: hay conflictos con otras marcas.",
        zodErrors,
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

    const oldData = checkResult.rows[0]; // 📸 Foto de cómo estaba la marca
    const oldImageKey = oldData.image_key;

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
      oldData, // 🔥 old_data: La foto completa de antes
      validatedFields.data, // 🔥 new_data: Los datos nuevos
    );

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(`${REVALIDATE_ROUTE}/${id}`);
    return {
      success: true,
      message: "Marca actualizada correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en updateBrandAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }
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
    await logAudit(
      session.user.id,
      "UPDATE",
      "brands",
      id,
      { status: currentStatus }, // 🔥 old_data
      { status: nextStatus }, // 🔥 new_data
    );

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

    // 📋 AUDITORÍA
    await logAudit(
      adminId,
      "SOFT_DELETE",
      "brands",
      id,
      { deleted_at: null }, // 🔥 old_data
      { deleted_at: new Date().toISOString() }, // 🔥 new_data
    );

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

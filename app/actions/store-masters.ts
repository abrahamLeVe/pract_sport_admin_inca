"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit"; // 🔥 Importamos logAudit
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  ColorInput,
  colorSchema,
  EditColorInput,
  editColorSchema,
  EditSizeInput,
  editSizeSchema,
  SizeInput,
  sizeSchema,
} from "@/validations/variants";
import { revalidatePath } from "next/cache";
import z from "zod";

const REVALIDATE_ROUTE = "/dashboard/store-settings";

// ============================================================================
// 1. ACCIONES PARA COLORES (Master Colors)
// ============================================================================

export async function createMasterColorAction(
  prevState: ActionState<ColorInput>,
  formData: FormData,
): Promise<ActionState<ColorInput>> {
  const session = await requireAdminSession();

  const fields = {
    name: formData.get("name")?.toString().trim() || "",
    hex_code: formData.get("hex_code")?.toString() || "",
  };

  try {
    const validatedFields = colorSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name, hex_code } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_colors WHERE name ILIKE $1",
      [name],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este color ya existe.",
        zodErrors: { name: ["El nombre ya está registrado."] },
        data: fields,
      };
    }

    const finalHex = hex_code ? hex_code : null;

    // 🔥 Añadimos RETURNING id
    const result = await pool.query(
      "INSERT INTO master_colors (name, hex_code) VALUES ($1, $2) RETURNING id",
      [name, finalHex],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "CREATE",
      "master_colors",
      result.rows[0].id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Color creado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en createMasterColorAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
}

export async function updateMasterColorAction(
  prevState: ActionState<EditColorInput>,
  formData: FormData,
): Promise<ActionState<EditColorInput>> {
  const session = await requireAdminSession();

  const fields = {
    id: Number(formData.get("id") || ""),
    name: formData.get("name")?.toString().trim() || "",
    hex_code: formData.get("hex_code")?.toString() || "",
  };

  try {
    const validatedFields = editColorSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { id, name, hex_code } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_colors WHERE name ILIKE $1 AND id != $2",
      [name, id],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "El nombre ya está siendo usado.",
        zodErrors: { name: ["El nombre ya existe."] },
        data: fields,
      };
    }

    // 🔥 PASO 1: Captura de Foto
    const oldRecord = await pool.query(
      "SELECT * FROM master_colors WHERE id = $1",
      [id],
    );
    if (oldRecord.rowCount === 0) {
      return { success: false, message: "El color no existe.", data: fields };
    }
    const oldData = oldRecord.rows[0];

    const finalHex = hex_code ? hex_code : null;

    await pool.query(
      "UPDATE master_colors SET name = $1, hex_code = $2 WHERE id = $3",
      [name, finalHex, id],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "UPDATE",
      "master_colors",
      id,
      oldData,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Color actualizado." };
  } catch (error: any) {
    console.error("❌ Error en updateMasterColorAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function deleteMasterColorAction(id: number) {
  const session = await requireAdminSession();
  try {
    // 🔥 Captura de Foto antes de borrar
    const oldRecord = await pool.query(
      "SELECT * FROM master_colors WHERE id = $1",
      [id],
    );
    if (oldRecord.rowCount === 0) {
      return { success: false, message: "El color no existe." };
    }
    const oldData = oldRecord.rows[0];

    await pool.query("DELETE FROM master_colors WHERE id = $1", [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "HARD_DELETE",
      "master_colors",
      id,
      oldData,
      null,
    );

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Color eliminado." };
  } catch (error: any) {
    console.error("❌ Error en deleteMasterColorAction:", error.message);
    return {
      success: false,
      message:
        "No se pudo eliminar (probablemente esté en uso por un producto).",
    };
  }
}

// ============================================================================
// 2. ACCIONES PARA TALLAS (Master Sizes)
// ============================================================================

export async function createMasterSizeAction(
  prevState: ActionState<SizeInput>,
  formData: FormData,
): Promise<ActionState<SizeInput>> {
  const session = await requireAdminSession();

  const fields = {
    name: formData.get("name")?.toString().trim() || "",
    category: formData.get("category")?.toString() || "",
  };

  try {
    const validatedFields = sizeSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name, category } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_sizes WHERE name ILIKE $1",
      [name],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Esta talla ya existe.",
        zodErrors: { name: ["La talla ya está registrada."] },
        data: fields,
      };
    }

    const finalCategory = category ? category : null;

    // 🔥 Añadimos RETURNING id
    const result = await pool.query(
      "INSERT INTO master_sizes (name, category) VALUES ($1, $2) RETURNING id",
      [name, finalCategory],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "CREATE",
      "master_sizes",
      result.rows[0].id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Talla creada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en createMasterSizeAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
}

export async function updateMasterSizeAction(
  prevState: ActionState<EditSizeInput>,
  formData: FormData,
): Promise<ActionState<EditSizeInput>> {
  const session = await requireAdminSession();

  const fields = {
    id: Number(formData.get("id") || ""),
    name: formData.get("name")?.toString().trim() || "",
    category: formData.get("category")?.toString() || "",
  };

  try {
    const validatedFields = editSizeSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { id, name, category } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_sizes WHERE name ILIKE $1 AND id != $2",
      [name, id],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "El nombre ya está siendo usado.",
        zodErrors: { name: ["La talla ya existe."] },
        data: fields,
      };
    }

    // 🔥 PASO 1: Captura de Foto
    const oldRecord = await pool.query(
      "SELECT * FROM master_sizes WHERE id = $1",
      [id],
    );
    if (oldRecord.rowCount === 0) {
      return { success: false, message: "La talla no existe.", data: fields };
    }
    const oldData = oldRecord.rows[0];

    const finalCategory = category ? category : null;

    await pool.query(
      "UPDATE master_sizes SET name = $1, category = $2 WHERE id = $3",
      [name, finalCategory, id],
    );

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "UPDATE",
      "master_sizes",
      id,
      oldData,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Talla actualizada." };
  } catch (error: any) {
    console.error("❌ Error en updateMasterSizeAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function deleteMasterSizeAction(id: number) {
  const session = await requireAdminSession();
  try {
    // 🔥 Captura de Foto antes de borrar
    const oldRecord = await pool.query(
      "SELECT * FROM master_sizes WHERE id = $1",
      [id],
    );
    if (oldRecord.rowCount === 0) {
      return { success: false, message: "La talla no existe." };
    }
    const oldData = oldRecord.rows[0];

    await pool.query("DELETE FROM master_sizes WHERE id = $1", [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "HARD_DELETE",
      "master_sizes",
      id,
      oldData,
      null,
    );

    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Talla eliminada." };
  } catch (error: any) {
    console.error("❌ Error en deleteMasterSizeAction:", error.message);
    return {
      success: false,
      message:
        "No se pudo eliminar (probablemente esté en uso por un producto).",
    };
  }
}

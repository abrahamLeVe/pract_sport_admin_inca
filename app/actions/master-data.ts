"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  AgeCategoryInput,
  ageCategorySchema,
  DistanceInput,
  distanceSchema,
  EditAgeCategoryInput,
  editAgeCategorySchema,
  EditDistanceInput,
  editDistanceSchema,
  EditEventTypeInput,
  editEventTypeSchema,
  EditGenderInput,
  editGenderSchema,
  EventTypeInput,
  eventTypeSchema,
  GenderInput,
  genderSchema,
} from "@/validations/master-data";
import { revalidatePath } from "next/cache";
import z from "zod";

const REVALIDATE_ROUTE = "/dashboard/race-settings";

export async function createMasterDistanceAction(
  prevState: ActionState<DistanceInput>,
  formData: FormData,
): Promise<ActionState<DistanceInput>> {
  await requireAdminSession();
  const fields = { name: formData.get("name")?.toString() || "" };
  try {
    const validatedFields = distanceSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_distances WHERE name ILIKE $1",
      [name],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Esta distancia ya existe.",
        zodErrors: { name: ["El nombre ya está registrado."] },
        data: fields,
      };
    }

    await pool.query("INSERT INTO master_distances (name) VALUES ($1)", [name]);
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Distancia creada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en createMasterDistanceAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
}

export async function updateMasterDistanceAction(
  prevState: ActionState<EditDistanceInput>,
  formData: FormData,
): Promise<ActionState<EditDistanceInput>> {
  await requireAdminSession();
  const fields = {
    id: Number(formData.get("id") || ""),
    name: formData.get("name")?.toString() || "",
  };
  try {
    const validatedFields = editDistanceSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields, // o fields, para que no se borren los inputs
      };
    }

    const { id, name } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_distances WHERE name ILIKE $1 AND id != $2",
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

    await pool.query("UPDATE master_distances SET name = $1 WHERE id = $2", [
      name,
      id,
    ]);
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Distancia actualizada." };
  } catch (error: any) {
    console.error("❌ Error en updateMasterDistanceAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function deleteMasterDistanceAction(id: number) {
  await requireAdminSession();
  try {
    await pool.query("DELETE FROM master_distances WHERE id = $1", [id]);
    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Distancia eliminada." };
  } catch (error: any) {
    console.error("❌ Error en deleteMasterDistanceAction:", error.message);
    return {
      success: false,
      message: "No se pudo eliminar (probablemente esté en uso).",
    };
  }
}

export async function createMasterGenderAction(
  prevState: ActionState<GenderInput>,
  formData: FormData,
): Promise<ActionState<GenderInput>> {
  await requireAdminSession();
  const fields = { name: formData.get("name")?.toString() || "" };
  try {
    const validatedFields = genderSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name } = validatedFields.data;
    const nameCheck = await pool.query(
      "SELECT id FROM master_genders WHERE name ILIKE $1",
      [name],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este género ya existe.",
        zodErrors: { name: ["El nombre ya está registrado."] },
        data: fields,
      };
    }

    await pool.query("INSERT INTO master_genders (name) VALUES ($1)", [name]);
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Género creado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en createMasterGenderAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
}

export async function updateMasterGenderAction(
  prevState: ActionState<EditGenderInput>,
  formData: FormData,
): Promise<ActionState<EditGenderInput>> {
  await requireAdminSession();

  const fields = {
    id: Number(formData.get("id") || ""),
    name: formData.get("name")?.toString() || "",
  };
  try {
    const validatedFields = editGenderSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { id, name } = validatedFields.data;
    const nameCheck = await pool.query(
      "SELECT id FROM master_genders WHERE name ILIKE $1 AND id != $2",
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

    await pool.query("UPDATE master_genders SET name = $1 WHERE id = $2", [
      name,
      id,
    ]);
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Género actualizado." };
  } catch (error: any) {
    console.error("❌ Error en updateMasterGenderAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function deleteMasterGenderAction(id: number) {
  await requireAdminSession();
  try {
    await pool.query("DELETE FROM master_genders WHERE id = $1", [id]);
    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Género eliminado." };
  } catch (error: any) {
    console.error("❌ Error en deleteMasterGenderAction:", error.message);
    return {
      success: false,
      message: "No se pudo eliminar (probablemente esté en uso).",
    };
  }
}

// ============================================================================
// 3. CATEGORÍAS DE EDAD (Master Age Categories)
// ============================================================================

export async function createMasterAgeCategoryAction(
  prevState: ActionState<AgeCategoryInput>,
  formData: FormData,
): Promise<ActionState<AgeCategoryInput>> {
  await requireAdminSession();
  const fields = {
    name: formData.get("name")?.toString() || "",
    default_min_age: Number(formData.get("default_min_age") || 0),
    default_max_age: Number(formData.get("default_max_age") || 0),
  };
  try {
    const validatedFields = ageCategorySchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name, default_min_age, default_max_age } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_age_categories WHERE name ILIKE $1",
      [name],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Esta categoría ya existe.",
        zodErrors: { name: ["El nombre ya está registrado."] },
        data: fields,
      };
    }

    const overlapCheck = await pool.query(
      `SELECT id FROM master_age_categories 
       WHERE ($1::integer <= default_max_age) AND ($2::integer >= default_min_age)`,
      [default_min_age, default_max_age],
    );

    if ((overlapCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "El rango de edad se solapa con una categoría existente.",
        zodErrors: {
          default_min_age: ["Conflicto de rango."],
          default_max_age: ["Conflicto de rango."],
        },
        data: fields,
      };
    }

    await pool.query(
      "INSERT INTO master_age_categories (name, default_min_age, default_max_age) VALUES ($1, $2, $3)",
      [name, default_min_age, default_max_age],
    );
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Categoría creada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en createMasterAgeCategoryAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
}

export async function updateMasterAgeCategoryAction(
  prevState: ActionState<EditAgeCategoryInput>,
  formData: FormData,
): Promise<ActionState<EditAgeCategoryInput>> {
  await requireAdminSession();

  const fields = {
    id: Number(formData.get("id") || ""),
    name: formData.get("name")?.toString() || "",
    default_min_age: Number(formData.get("default_min_age") || 0),
    default_max_age: Number(formData.get("default_max_age") || 0),
  };
  try {
    const validatedFields = editAgeCategorySchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { id, name, default_min_age, default_max_age } = validatedFields.data;

    const nameCheck = await pool.query(
      "SELECT id FROM master_age_categories WHERE name ILIKE $1 AND id != $2",
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

    const overlapCheck = await pool.query(
      `SELECT id FROM master_age_categories 
       WHERE ($1::integer <= default_max_age) AND ($2::integer >= default_min_age) AND id != $3`,
      [default_min_age, default_max_age, id],
    );

    if ((overlapCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "El rango de edad se solapa con otra categoría.",
        zodErrors: {
          default_min_age: ["Conflicto de rango."],
          default_max_age: ["Conflicto de rango."],
        },
        data: fields,
      };
    }

    await pool.query(
      "UPDATE master_age_categories SET name = $1, default_min_age = $2, default_max_age = $3 WHERE id = $4",
      [name, default_min_age, default_max_age, id],
    );
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Categoría actualizada." };
  } catch (error: any) {
    console.error("❌ Error en updateMasterAgeCategoryAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function deleteMasterAgeCategoryAction(id: number) {
  await requireAdminSession();
  try {
    await pool.query("DELETE FROM master_age_categories WHERE id = $1", [id]);
    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Categoría eliminada." };
  } catch (error: any) {
    console.error("❌ Error en deleteMasterAgeCategoryAction:", error.message);
    return {
      success: false,
      message: "No se pudo eliminar (probablemente esté en uso).",
    };
  }
}

// ============================================================================
// 4. TIPOS DE EVENTO (Master Event Types)
// ============================================================================

export async function createMasterEventTypeAction(
  prevState: ActionState<EventTypeInput>,
  formData: FormData,
): Promise<ActionState<EventTypeInput>> {
  await requireAdminSession();
  const fields = { name: formData.get("name")?.toString() || "" };
  try {
    const validatedFields = eventTypeSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name } = validatedFields.data;
    const nameCheck = await pool.query(
      "SELECT id FROM master_event_types WHERE name ILIKE $1",
      [name],
    );
    if ((nameCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "Este tipo de evento ya existe.",
        zodErrors: { name: ["El nombre ya está registrado."] },
        data: fields,
      };
    }

    await pool.query("INSERT INTO master_event_types (name) VALUES ($1)", [
      name,
    ]);
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Tipo de evento creado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en createMasterEventTypeAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado.",
      data: fields,
    };
  }
}

export async function updateMasterEventTypeAction(
  prevState: ActionState<EditEventTypeInput>,
  formData: FormData,
): Promise<ActionState<EditEventTypeInput>> {
  await requireAdminSession();

  const fields = {
    id: Number(formData.get("id") || ""),
    name: formData.get("name")?.toString() || "",
  };
  try {
    const validatedFields = editEventTypeSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { id, name } = validatedFields.data;
    const nameCheck = await pool.query(
      "SELECT id FROM master_event_types WHERE name ILIKE $1 AND id != $2",
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

    await pool.query("UPDATE master_event_types SET name = $1 WHERE id = $2", [
      name,
      id,
    ]);
    revalidatePath(REVALIDATE_ROUTE);

    return { success: true, message: "Tipo de evento actualizado." };
  } catch (error: any) {
    console.error("❌ Error en updateMasterEventTypeAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

export async function deleteMasterEventTypeAction(id: number) {
  await requireAdminSession();
  try {
    await pool.query("DELETE FROM master_event_types WHERE id = $1", [id]);
    revalidatePath(REVALIDATE_ROUTE);
    return { success: true, message: "Tipo de evento eliminado." };
  } catch (error: any) {
    console.error("❌ Error en deleteMasterEventTypeAction:", error.message);
    return {
      success: false,
      message: "No se pudo eliminar (probablemente esté en uso).",
    };
  }
}

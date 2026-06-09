"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  editEventCategorySchema,
  eventCategorySchema,
  FormEventState,
} from "@/validations/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createEventCategoryAction(
  event_id: number,
  prevState: FormEventState,
  formData: FormData,
): Promise<FormEventState> {
  try {
    await requireAdminSession();

    const fields = {
      distance_id: formData.get("distance_id")?.toString(),
      gender_id: formData.get("gender_id")?.toString(),
      age_category_id: formData.get("age_category_id")?.toString(),
      applied_min_age: formData.get("applied_min_age")?.toString(),
      applied_max_age: formData.get("applied_max_age")?.toString(),
      price: formData.get("price")?.toString() || "0",
      cupos: formData.get("cupos")?.toString() || "0",
    };

    const validatedFields = eventCategorySchema.safeParse(fields);

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
      distance_id,
      gender_id,
      age_category_id,
      applied_min_age,
      applied_max_age,
      price,
      cupos,
    } = validatedFields.data;

    const overlapQuery = `
      SELECT mac.name AS conflicting_name 
      FROM event_categories ec
      JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE ec.event_id = $1 AND ec.distance_id = $2 AND ec.gender_id = $3
      AND ($4 <= ec.applied_max_age AND $5 >= ec.applied_min_age)
    `;
    const overlapResult = await pool.query(overlapQuery, [
      event_id,
      distance_id,
      gender_id,
      applied_min_age,
      applied_max_age,
    ]);

    if ((overlapResult.rowCount ?? 0) > 0) {
      const conflictingName = overlapResult.rows[0].conflicting_name;
      return {
        success: false,
        message: `Error: El rango de edad (${applied_min_age}-${applied_max_age}) choca con la categoría existente "${conflictingName}".`,
        data: fields,
      };
    }

    const query = `
      INSERT INTO event_categories (event_id, distance_id, gender_id, age_category_id, applied_min_age, applied_max_age, price, cupos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    await pool.query(query, [
      event_id,
      distance_id,
      gender_id,
      age_category_id,
      applied_min_age,
      applied_max_age,
      price,
      cupos,
    ]);

    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return { success: true, message: "Categoría agregada correctamente." };
  } catch (error: any) {
    console.error("❌ Error createEventCategoryAction:", error.message);
    return { success: false, message: "Error al guardar la categoría." };
  }
}

export async function updateEventCategoryAction(
  event_id: number,
  prevState: FormEventState,
  formData: FormData,
): Promise<FormEventState> {
  try {
    await requireAdminSession();

    const fields = {
      id: formData.get("id")?.toString() || "",
      distance_id: formData.get("distance_id")?.toString(),
      gender_id: formData.get("gender_id")?.toString(),
      age_category_id: formData.get("age_category_id")?.toString(),
      applied_min_age: formData.get("applied_min_age")?.toString(),
      applied_max_age: formData.get("applied_max_age")?.toString(),
      price: formData.get("price")?.toString() || "0",
      cupos: formData.get("cupos")?.toString() || "0",
    };

    const validatedFields = editEventCategorySchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const {
      id,
      distance_id,
      gender_id,
      age_category_id,
      applied_min_age,
      applied_max_age,
      price,
      cupos,
    } = validatedFields.data;

    const overlapQuery = `
      SELECT mac.name AS conflicting_name 
      FROM event_categories ec
      JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE ec.event_id = $1 AND ec.distance_id = $2 AND ec.gender_id = $3
      AND ($4 <= ec.applied_max_age AND $5 >= ec.applied_min_age)
      AND ec.id != $6
    `;
    const overlapResult = await pool.query(overlapQuery, [
      event_id,
      distance_id,
      gender_id,
      applied_min_age,
      applied_max_age,
      id,
    ]);

    if ((overlapResult.rowCount ?? 0) > 0) {
      const conflictingName = overlapResult.rows[0].conflicting_name;
      return {
        success: false,
        message: `Error: Estas edades chocan con la categoría "${conflictingName}". Ajusta los números.`,
        data: fields,
      };
    }

    const query = `
      UPDATE event_categories SET 
        distance_id = $1, gender_id = $2, age_category_id = $3, 
        applied_min_age = $4, applied_max_age = $5, price = $6, cupos = $7
      WHERE id = $8 AND event_id = $9
    `;
    await pool.query(query, [
      distance_id,
      gender_id,
      age_category_id,
      applied_min_age,
      applied_max_age,
      price,
      cupos,
      id,
      event_id,
    ]);

    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return { success: true, message: "Categoría actualizada correctamente." };
  } catch (error: any) {
    console.error("❌ Error updateEventCategoryAction:", error.message);
    return { success: false, message: "Error al actualizar." };
  }
}

export async function deleteEventCategoryAction(id: number, event_id: number) {
  try {
    await requireAdminSession();
    const deleteQuery =
      "DELETE FROM event_categories WHERE id = $1 AND event_id = $2";
    await pool.query(deleteQuery, [id, event_id]);
    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return { success: true, message: "Categoría eliminada correctamente." };
  } catch (error: any) {
    console.error("❌ Error deleteEventCategoryAction:", error.message);

    if (error.code === "23503") {
      return {
        success: false,
        message:
          "No se puede eliminar. Ya existen atletas inscritos en esta categoría. Debes cancelar sus inscripciones y gestionar los reembolsos primero.",
      };
    }

    return { success: false, message: "No se pudo eliminar la categoría." };
  }
}

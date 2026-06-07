"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  eventCategorySchema,
  editEventCategorySchema,
  FormEventCategoryState,
} from "@/validations/event-categories";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

export async function createEventCategoryAction(
  event_id: number,
  prevState: FormEventCategoryState,
  formData: FormData,
): Promise<FormEventCategoryState> {
  try {
    await requireAdminSession();

    const fields = {
      name: formData.get("name")?.toString() || "",
      min_age: formData.get("min_age")?.toString(),
      max_age: formData.get("max_age")?.toString(),
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

    const { name, min_age, max_age, price, cupos } = validatedFields.data;

    const query = `
      INSERT INTO event_categories (event_id, name, min_age, max_age, price, cupos)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    await pool.query(query, [event_id, name, min_age, max_age, price, cupos]);

    revalidatePath(`/dashboard/events/edit/${event_id}`);
  } catch (error: any) {
    console.error("❌ Error en createEventCategoryAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error al guardar la categoría.",
    };
  }

  redirect(`/dashboard/events/edit/${event_id}`);
}

export async function updateEventCategoryAction(
  event_id: number,
  prevState: FormEventCategoryState,
  formData: FormData,
): Promise<FormEventCategoryState> {
  try {
    await requireAdminSession();

    const rawFormData = {
      id: formData.get("id")?.toString() || "",
      event_id: event_id,
      name: formData.get("name")?.toString() || "",
      min_age: formData.get("min_age")?.toString(),
      max_age: formData.get("max_age")?.toString(),
      price: formData.get("price")?.toString() || "0",
      cupos: formData.get("cupos")?.toString() || "0",
    };

    const validatedFields = editEventCategorySchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: rawFormData,
      };
    }

    const { id, name, min_age, max_age, price, cupos } = validatedFields.data;

    const query = `
      UPDATE event_categories SET 
        name = $1, min_age = $2, max_age = $3, price = $4, cupos = $5
      WHERE id = $6 AND event_id = $7
    `;
    await pool.query(query, [
      name,
      min_age,
      max_age,
      price,
      cupos,
      id,
      event_id,
    ]);

    revalidatePath(`/dashboard/events/edit/${event_id}`);
  } catch (error: any) {
    console.error("❌ Error en updateEventCategoryAction:", error.message);
    return { success: false, message: error.message || "Error al actualizar." };
  }

  redirect(`/dashboard/events/edit/${event_id}`);
}

export async function deleteEventCategoryAction(id: number, event_id: number) {
  try {
    await requireAdminSession();

    const deleteQuery =
      "DELETE FROM event_categories WHERE id = $1 AND event_id = $2";
    await pool.query(deleteQuery, [id, event_id]);

    revalidatePath(`/dashboard/events/edit/${event_id}`);
    return { success: true, message: "Categoría eliminada correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteEventCategoryAction:", error.message);
    return {
      success: false,
      message: "No se pudo eliminar la categoría.",
    };
  }
}

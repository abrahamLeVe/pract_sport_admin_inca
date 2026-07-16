"use server";

import {
  requireAdminSession,
  requireSuperAdminSession,
} from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  EditEventCategoryInput,
  editEventCategorySchema,
  EventCategoryInput,
  eventCategorySchema,
} from "@/validations/events";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function createEventCategoryAction(
  prevState: ActionState<EventCategoryInput>,
  formData: FormData,
): Promise<ActionState<EventCategoryInput>> {
  const session = await requireAdminSession();
  const event_id = Number(formData.get("event_id"));

  const fields = {
    distance_id: Number(formData.get("distance_id")),
    gender_id: Number(formData.get("gender_id")),
    age_category_id: Number(formData.get("age_category_id")),
    applied_min_age: Number(formData.get("min_age") || 0),
    applied_max_age: Number(formData.get("max_age") || 0),
    price: Number(formData.get("price") || 0),
    cupos: Number(formData.get("cupos") || 0),
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

  try {
    const overlapQuery = `
      SELECT mac.name AS conflicting_name 
      FROM event_categories ec
      JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE ec.event_id = $1 AND ec.distance_id = $2 AND ec.gender_id = $3
      AND ($4 <= ec.applied_max_age AND $5 >= ec.applied_min_age)
      AND ec.deleted_at IS NULL
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
        message: `Error: El rango de edad (${applied_min_age}-${applied_max_age}) choca con la categoría activa "${conflictingName}".`,
        data: fields,
      };
    }

    // 🔥 Añadimos RETURNING id para poder auditarlo
    const query = `
      INSERT INTO event_categories (event_id, distance_id, gender_id, age_category_id, applied_min_age, applied_max_age, price, cupos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    const result = await pool.query(query, [
      event_id,
      distance_id,
      gender_id,
      age_category_id,
      applied_min_age,
      applied_max_age,
      price,
      cupos,
    ]);

    const newId = result.rows[0].id;

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "CREATE",
      "event_categories",
      newId,
      null,
      validatedFields.data,
    );

    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return { success: true, message: "Categoría agregada correctamente." };
  } catch (error: any) {
    console.error("❌ Error createEventCategoryAction:", error.message);
    return {
      success: false,
      message: "Error al guardar la categoría.",
      data: fields,
    };
  }
}

export async function updateEventCategoryAction(
  prevState: ActionState<EditEventCategoryInput>,
  formData: FormData,
): Promise<ActionState<EditEventCategoryInput>> {
  const session = await requireAdminSession();
  const event_id = Number(formData.get("event_id"));
  const fields = {
    id: Number(formData.get("id")),
    distance_id: Number(formData.get("distance_id")),
    gender_id: Number(formData.get("gender_id")),
    age_category_id: Number(formData.get("age_category_id")),
    applied_min_age: Number(formData.get("min_age") || 0),
    applied_max_age: Number(formData.get("max_age") || 0),
    price: Number(formData.get("price") || 0),
    cupos: Number(formData.get("cupos") || 0),
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

  try {
    const overlapQuery = `
      SELECT mac.name AS conflicting_name 
      FROM event_categories ec
      JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE ec.event_id = $1 AND ec.distance_id = $2 AND ec.gender_id = $3
      AND ($4 <= ec.applied_max_age AND $5 >= ec.applied_min_age)
      AND ec.id != $6
      AND ec.deleted_at IS NULL
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
        message: `Error: Estas edades chocan con la categoría activa "${conflictingName}".`,
        data: fields,
      };
    }

    const query = `
      UPDATE event_categories SET 
        distance_id = $1, gender_id = $2, age_category_id = $3, 
        applied_min_age = $4, applied_max_age = $5, price = $6, cupos = $7,
        updated_at = NOW()
      WHERE id = $8 AND event_id = $9 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [
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

    if (result.rowCount === 0) {
      return {
        success: false,
        message:
          "No se pudo actualizar porque la categoría no existe o fue eliminada.",
        data: fields,
      };
    }

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "UPDATE",
      "event_categories",
      id,
      null,
      validatedFields.data,
    );

    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return { success: true, message: "Categoría actualizada correctamente." };
  } catch (error: any) {
    console.error("❌ Error updateEventCategoryAction:", error.message);
    return { success: false, message: "Error al actualizar.", data: fields };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteEventCategoryAction(id: number, event_id: number) {
  const session = await requireAdminSession(); // 🔥 Capturamos la sesión
  try {
    const query =
      "UPDATE event_categories SET deleted_at = NOW() WHERE id = $1 AND event_id = $2";
    await pool.query(query, [id, event_id]);

    // 🔥 Guardamos al usuario que hizo la acción
    await logAudit(session.user.id, "SOFT_DELETE", "event_categories", id);

    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return { success: true, message: "Categoría enviada a la papelera." };
  } catch (error: any) {
    console.error("❌ Error en deleteEventCategoryAction:", error.message);
    return {
      success: false,
      message: "No se pudo enviar la categoría a la papelera.",
    };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteEventCategoriesAction(
  ids: number[],
  event_id: number,
) {
  const session = await requireAdminSession(); // 🔥 Capturamos la sesión
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay categorías seleccionadas." };
    }

    const query =
      "UPDATE event_categories SET deleted_at = NOW() WHERE id = ANY($1) AND event_id = $2";
    await pool.query(query, [ids, event_id]);

    // 🔥 Unimos los IDs con comas para guardarlos como string en el record_id
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "event_categories",
      ids.join(","),
    );

    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);
    return {
      success: true,
      message: `${ids.length} categorías enviadas a la papelera.`,
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkDeleteEventCategoriesAction:",
      error.message,
    );
    return {
      success: false,
      message: "Error al enviar las categorías a la papelera.",
    };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete Protegido)
// ============================================================================
export async function permanentlyDeleteEventCategoryAction(
  id: number,
  event_id: number,
) {
  const session = await requireSuperAdminSession();
  const client = await pool.connect(); // 🔥 Usamos un cliente para la transacción

  try {
    await client.query("BEGIN");

    // 🔥 CANDADO DE SEGURIDAD: Verificar si la categoría tiene atletas inscritos
    const checkQuery =
      "SELECT COUNT(*) FROM event_registrations WHERE category_id = $1";
    const checkResult = await client.query(checkQuery, [id]);

    if (parseInt(checkResult.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message:
          "No se puede eliminar. Ya existen atletas inscritos en esta categoría.",
      };
    }

    // Procedemos a borrar si está vacía
    const deleteQuery =
      "DELETE FROM event_categories WHERE id = $1 AND event_id = $2";
    await client.query(deleteQuery, [id, event_id]);

    await client.query("COMMIT");

    // Auditoría y revalidación (fuera de la transacción de BD)
    await logAudit(session.user.id, "HARD_DELETE", "event_categories", id);
    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);

    return { success: true, message: "Categoría eliminada definitivamente." };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(
      "❌ Error en permanentlyDeleteEventCategoryAction:",
      error.message,
    );
    return { success: false, message: "No se pudo purgar la categoría." };
  } finally {
    client.release();
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete Protegido)
// ============================================================================
export async function bulkPermanentlyDeleteEventCategoriesAction(
  ids: number[],
  event_id: number,
) {
  const session = await requireSuperAdminSession();

  if (!ids || ids.length === 0) {
    return { success: false, message: "No hay categorías seleccionadas." };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🔥 CANDADO DE SEGURIDAD MASIVO: Verificar si ALGUNA categoría tiene atletas
    const checkQuery =
      "SELECT COUNT(*) FROM event_registrations WHERE category_id = ANY($1)";
    const checkResult = await client.query(checkQuery, [ids]);

    if (parseInt(checkResult.rows[0].count) > 0) {
      await client.query("ROLLBACK");
      return {
        success: false,
        message:
          "No se pueden eliminar. Algunas categorías seleccionadas tienen atletas inscritos.",
      };
    }

    // Procedemos a borrar masivamente
    const query =
      "DELETE FROM event_categories WHERE id = ANY($1) AND event_id = $2";
    await client.query(query, [ids, event_id]);

    await client.query("COMMIT");

    // Auditoría y revalidación
    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "event_categories",
      ids.join(","),
    );
    revalidatePath(`/dashboard/events/edit/${event_id}/categories`);

    return {
      success: true,
      message: "Las categorías seleccionadas se eliminaron permanentemente.",
    };
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error(
      "❌ Error en bulkPermanentlyDeleteEventCategoriesAction:",
      error.message,
    );
    return {
      success: false,
      message: "Error al purgar las categorías seleccionadas.",
    };
  } finally {
    client.release();
  }
}

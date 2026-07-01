"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  UpdateRegistrationStatusInput,
  updateRegistrationStatusSchema,
} from "@/validations/registrations";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function updateRegistrationStatusAction(
  prevState: ActionState<UpdateRegistrationStatusInput>,
  formData: FormData,
): Promise<ActionState<UpdateRegistrationStatusInput>> {
  const session = await requireAdminSession(); // 🔥 Capturamos la sesión para la auditoría

  const fields = {
    id: formData.get("id"),
    bib_number: formData.get("bib_number") || null,
    registration_status: formData.get("registration_status"),
    payment_status: formData.get("payment_status"),
  };

  try {
    const validatedFields = updateRegistrationStatusSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, verifica los campos del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields as any,
      };
    }

    const { id, bib_number, registration_status, payment_status } =
      validatedFields.data;

    if (bib_number !== null) {
      if (payment_status !== "paid" || registration_status !== "approved") {
        return {
          success: false,
          message:
            "❌ Seguridad: No puedes asignar un N° de Dorsal si el atleta no está marcado como 'Pagado' y 'Aprobado'.",
          data: fields as any,
        };
      }

      const checkEventQuery = `SELECT event_id FROM event_registrations WHERE id = $1`;
      const { rows: eventRows } = await pool.query(checkEventQuery, [id]);
      const event_id = eventRows[0].event_id;

      // 🔥 BARRERA 1: Ignoramos los dorsales de atletas que estén en la papelera
      const checkDupQuery = `
        SELECT id FROM event_registrations 
        WHERE event_id = $1 AND bib_number = $2 AND id != $3 AND deleted_at IS NULL
      `;
      const { rows: dupRows } = await pool.query(checkDupQuery, [
        event_id,
        bib_number,
        id,
      ]);

      if (dupRows.length > 0) {
        return {
          success: false,
          message: `❌ Error: El dorsal #${bib_number} ya fue asignado a otro atleta activo. Por favor usa otro número.`,
          data: fields as any,
        };
      }
    }

    // 🔥 BARRERA 2: Solo actualizamos si el registro no está en la papelera
    const query = `
      UPDATE event_registrations 
      SET bib_number = $1, 
          registration_status = $2, 
          payment_status = $3, 
          payment_verified_at = CASE WHEN $3::varchar = 'paid' AND payment_verified_at IS NULL THEN NOW() ELSE payment_verified_at END
      WHERE id = $4 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [
      bib_number,
      registration_status,
      payment_status,
      id,
    ]);

    // Validación uniforme
    if (result.rowCount === 0) {
      return {
        success: false,
        message:
          "No se pudo actualizar porque la inscripción no existe o fue eliminada.",
        data: fields as any,
      };
    }

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "UPDATE",
      "event_registrations",
      id,
      null,
      validatedFields.data,
    );

    revalidatePath("/dashboard/registrations");
    revalidatePath(`/dashboard/registrations/edit/${id}`);
    revalidatePath("/dashboard");

    return {
      success: true,
      message: "Atleta actualizado correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en updateRegistrationStatusAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error en el servidor al actualizar la inscripción.",
      data: fields as any,
    };
  }
}
export async function bulkAssignBibsAction(eventId: number, startBib: number) {
  try {
    // 🔥 BARRERA 3: La magia SQL ahora excluye a los registros eliminados para no desperdiciar números
    const query = `
      WITH numbered AS (
        SELECT id, row_number() OVER (ORDER BY created_at ASC) - 1 as rn
        FROM event_registrations
        WHERE event_id = $1 
          AND payment_status = 'paid' 
          AND registration_status = 'approved'
          AND deleted_at IS NULL
      )
      UPDATE event_registrations er
      SET bib_number = ($2::int + numbered.rn)::int
      FROM numbered
      WHERE er.id = numbered.id
      RETURNING er.id;
    `;

    const res = await pool.query(query, [eventId, startBib]);

    revalidatePath(`/dashboard/events/edit/${eventId}`);
    revalidatePath("/dashboard/registrations");

    return {
      success: true,
      count: res.rowCount,
      message: `¡Éxito! Se asignaron ${res.rowCount} dorsales secuenciales a los atletas activos.`,
    };
  } catch (error) {
    console.error("Error en asignación masiva de dorsales:", error);
    return {
      success: false,
      message: "Ocurrió un error al asignar los dorsales.",
    };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete de basura/tests)
// ============================================================================
export async function deleteRegistrationAction(id: number) {
  try {
    const session = await requireAdminSession();

    // Lo ocultamos (liberando su dorsal indirectamente gracias al filtro del GET)
    const softDeleteQuery =
      "UPDATE event_registrations SET deleted_at = NOW() WHERE id = $1";
    await pool.query(softDeleteQuery, [id]);

    await logAudit(session.user.id, "SOFT_DELETE", "event_registrations", id);

    revalidatePath("/dashboard/registrations");
    return {
      success: true,
      message: "Inscripción movida a la papelera (Oculta del sistema).",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteRegistrationAction:", error.message);
    return { success: false, message: "No se pudo eliminar la inscripción." };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteRegistrationAction(id: number) {
  try {
    const session = await requireAdminSession();

    // Como aquí no hay imagen en S3, solo borramos físicamente de la BD
    const deleteQuery = "DELETE FROM event_registrations WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    await logAudit(session.user.id, "HARD_DELETE", "event_registrations", id);

    revalidatePath("/dashboard/registrations");
    return {
      success: true,
      message: "Registro de prueba eliminado definitivamente.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en permanentlyDeleteRegistrationAction:",
      error.message,
    );
    return { success: false, message: "No se pudo purgar la inscripción." };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteRegistrationsAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    if (!ids || ids.length === 0)
      return { success: false, message: "No hay registros seleccionados." };

    const query =
      "UPDATE event_registrations SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "event_registrations",
      ids.join(","),
    );

    revalidatePath("/dashboard/registrations");
    return {
      success: true,
      message: `${ids.length} inscripciones movidas a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteRegistrationsAction:", error.message);
    return {
      success: false,
      message: "Error al eliminar las inscripciones seleccionadas.",
    };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteRegistrationsAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    if (!ids || ids.length === 0)
      return { success: false, message: "No hay registros seleccionados." };

    const deleteQuery = "DELETE FROM event_registrations WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "event_registrations",
      ids.join(","),
    );

    revalidatePath("/dashboard/registrations");
    return {
      success: true,
      message: "Los registros seleccionados se eliminaron de la base de datos.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteRegistrationsAction:",
      error.message,
    );
    return {
      success: false,
      message: "No se pudieron purgar las inscripciones seleccionadas.",
    };
  }
}

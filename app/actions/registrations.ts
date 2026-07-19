"use server";

import {
  requireAdminSession,
  requireSuperAdminSession,
} from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import { getRegistrationsForExport } from "@/lib/data/registrations";
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
  const session = await requireAdminSession();

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
      if (eventRows.length === 0)
        return {
          success: false,
          message: "Registro no encontrado.",
          data: fields as any,
        };
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

    // 🔥 PASO 1: CAPTURA DE FOTO ANTERIOR
    const oldRecord = await pool.query(
      "SELECT * FROM event_registrations WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );
    if (oldRecord.rowCount === 0) {
      return {
        success: false,
        message:
          "No se pudo actualizar porque la inscripción no existe o fue eliminada.",
        data: fields as any,
      };
    }
    const oldData = oldRecord.rows[0];

    // =========================================================================
    // 🔥 NUEVA BARRERA DE SEGURIDAD: Bloquear si ya tiene el kit entregado
    // =========================================================================
    if (oldData.registration_status === "checked_in") {
      return {
        success: false,
        message:
          "❌ Seguridad: Este atleta ya recogió su kit. Debes deshacer el check-in en el módulo de escáner para poder editarlo.",
        data: fields as any,
      };
    }
    // =========================================================================

    // 🔥 BARRERA 2: Solo actualizamos si el registro no está en la papelera
    const query = `
      UPDATE event_registrations 
      SET bib_number = $1, 
          registration_status = $2, 
          payment_status = $3, 
          payment_verified_at = CASE WHEN $3::varchar = 'paid' AND payment_verified_at IS NULL THEN NOW() ELSE payment_verified_at END
      WHERE id = $4
    `;

    await pool.query(query, [
      bib_number,
      registration_status,
      payment_status,
      id,
    ]);

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "UPDATE",
      "event_registrations",
      id,
      oldData, // 🔥 old_data: Estado anterior
      validatedFields.data, // 🔥 new_data: Nuevo estado
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

export async function bulkAssignBibsAction(
  eventId: number,
  startingBib: number,
) {
  try {
    // 1. OBTENER LOS IDS DE LOS ATLETAS QUE CUMPLEN LOS REQUISITOS
    const fetchAthletesQuery = `
      SELECT id 
      FROM event_registrations 
      WHERE event_id = $1 
        AND payment_status = 'paid' 
        AND registration_status = 'approved' 
        AND bib_number IS NULL 
        AND deleted_at IS NULL
      ORDER BY created_at ASC;
    `;
    const athletesRes = await pool.query(fetchAthletesQuery, [eventId]);
    const registrationIdsToAssign = athletesRes.rows.map((r) => r.id);

    if (registrationIdsToAssign.length === 0) {
      return {
        success: false,
        message:
          "No hay atletas con estado 'Pagado' y 'Aprobado' para asignar dorsales.",
      };
    }

    // 2. OBTENER DORSALES YA OCUPADOS
    const existingBibsQuery = `
      SELECT bib_number 
      FROM event_registrations 
      WHERE event_id = $1 AND bib_number IS NOT NULL AND deleted_at IS NULL;
    `;
    const res = await pool.query(existingBibsQuery, [eventId]);
    const occupiedBibs = new Set(res.rows.map((row) => row.bib_number));

    let currentBib = startingBib;

    // 3. TRANSACCIÓN PARA SEGURIDAD
    await pool.query("BEGIN");

    for (const regId of registrationIdsToAssign) {
      // Magia: saltar los números que ya están ocupados
      while (occupiedBibs.has(currentBib)) {
        currentBib++;
      }

      // 🔥 CORRECCIÓN: Eliminamos "updated_at = NOW()" porque esa columna no existe
      await pool.query(
        `
        UPDATE event_registrations 
        SET bib_number = $1
        WHERE id = $2;
        `,
        [currentBib, regId],
      );

      // Marcar como ocupado para esta sesión
      occupiedBibs.add(currentBib);
    }

    await pool.query("COMMIT");
    revalidatePath("/dashboard/registrations");
    return {
      success: true,
      message: `Se asignaron dorsales a ${registrationIdsToAssign.length} atletas correctamente.`,
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    console.error("Error en asignación masiva:", error);
    return { success: false, message: "Error interno al asignar dorsales." };
  }
}

// 🔥 NUEVA FUNCIÓN: Busca el número máximo actual y le suma 1
export async function getNextAvailableBibAction(eventId: number) {
  try {
    // 1. Buscamos el número máximo
    const query = `
      SELECT MAX(bib_number) as max_bib 
      FROM event_registrations 
      WHERE event_id = $1 AND deleted_at IS NULL;
    `;
    const res = await pool.query(query, [eventId]);
    const maxBib = res.rows[0]?.max_bib;

    // 2. 🔥 NUEVO: Contamos cuántos faltan por asignar
    const pendingQuery = `
      SELECT COUNT(*) as pending_count
      FROM event_registrations
      WHERE event_id = $1 
        AND payment_status = 'paid' 
        AND registration_status = 'approved' 
        AND bib_number IS NULL 
        AND deleted_at IS NULL;
    `;
    const pendingRes = await pool.query(pendingQuery, [eventId]);
    const pendingCount = parseInt(pendingRes.rows[0]?.pending_count || "0", 10);

    return {
      success: true,
      nextBib: maxBib ? maxBib + 1 : 100,
      hasPrevious: !!maxBib,
      pendingCount, // Enviamos este número al frontend
    };
  } catch (error) {
    console.error("Error buscando el siguiente dorsal:", error);
    return {
      success: false,
      nextBib: 100,
      hasPrevious: false,
      pendingCount: 0,
    };
  }
}

export async function exportEventCsvAction(eventId: number) {
  // 🔒 SEGURIDAD: Solo admins
  await requireAdminSession();

  try {
    const rawData = await getRegistrationsForExport(eventId);

    if (rawData.length === 0) {
      return {
        success: false,
        message: "No hay atletas inscritos para exportar.",
      };
    }

    // Devolvemos la data tal cual
    return { success: true, data: rawData };
  } catch (error) {
    console.error("Error al exportar registros:", error);
    return { success: false, message: "Error interno al obtener los datos." };
  }
}
// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete de basura/tests)
// ============================================================================
export async function deleteRegistrationAction(id: number) {
  const session = await requireAdminSession();
  try {
    // Lo ocultamos (liberando su dorsal indirectamente gracias al filtro del GET)
    const softDeleteQuery =
      "UPDATE event_registrations SET deleted_at = NOW() WHERE id = $1";
    await pool.query(softDeleteQuery, [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "SOFT_DELETE",
      "event_registrations",
      id,
      { deleted_at: null },
      { deleted_at: new Date().toISOString() },
    );

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
  const session = await requireSuperAdminSession();
  try {
    // 🔥 1. Capturamos la foto de la inscripción antes de destruirla
    const { rows } = await pool.query(
      "SELECT * FROM event_registrations WHERE id = $1",
      [id],
    );
    if (rows.length === 0) {
      return { success: false, message: "La inscripción no existe." };
    }
    const oldData = rows[0];

    // 🔥 CANDADO DE SEGURIDAD: Evitar borrar inscripciones pagadas
    if (oldData.payment_status === "paid") {
      return {
        success: false,
        message:
          "No se puede purgar. La inscripción ya fue pagada. Envíala a la papelera o cancélela.",
      };
    }

    const deleteQuery = "DELETE FROM event_registrations WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "HARD_DELETE",
      "event_registrations",
      id,
      oldData, // 🔥 old_data: Toda la evidencia
      null,
    );

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
  const session = await requireAdminSession();
  try {
    if (!ids || ids.length === 0)
      return { success: false, message: "No hay registros seleccionados." };

    const query =
      "UPDATE event_registrations SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_SOFT_DELETE",
      "event_registrations",
      ids.join(","),
      { deleted_at: null },
      { deleted_at: new Date().toISOString() },
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
  const session = await requireSuperAdminSession();
  try {
    if (!ids || ids.length === 0)
      return { success: false, message: "No hay registros seleccionados." };

    // 🔥 1. Capturamos la foto grupal
    const { rows } = await pool.query(
      "SELECT * FROM event_registrations WHERE id = ANY($1)",
      [ids],
    );
    const oldDataArray = rows;

    // 🔥 CANDADO DE SEGURIDAD MASIVO: Bloquear si hay pagos
    const hasPaid = oldDataArray.some((row) => row.payment_status === "paid");
    if (hasPaid) {
      return {
        success: false,
        message:
          "No se puede purgar. Uno o más atletas seleccionados ya han pagado.",
      };
    }

    const deleteQuery = "DELETE FROM event_registrations WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    // 📋 AUDITORÍA
    await logAudit(
      session.user.id,
      "BULK_HARD_DELETE",
      "event_registrations",
      ids.join(","),
      oldDataArray, // 🔥 old_data: Array con todas las inscripciones borradas
      null,
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

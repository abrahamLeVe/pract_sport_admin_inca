"use server";

import { requireAdminSession } from "@/lib/auth-guard";
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
  await requireAdminSession();

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

      const checkDupQuery = `
        SELECT id FROM event_registrations 
        WHERE event_id = $1 AND bib_number = $2 AND id != $3
      `;
      const { rows: dupRows } = await pool.query(checkDupQuery, [
        event_id,
        bib_number,
        id,
      ]);

      if (dupRows.length > 0) {
        return {
          success: false,
          message: `❌ Error: El dorsal #${bib_number} ya fue asignado a otro atleta en este evento. Por favor usa otro número.`,
          data: fields as any,
        };
      }
    }

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

    revalidatePath("/dashboard/registrations");
    revalidatePath(`/dashboard/registrations/edit/${id}`);

    return {
      success: true,
      message: "Atleta actualizado correctamente. Dorsal asignado.",
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

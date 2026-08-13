"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function processRaceDayAttendance(qrData: string) {
  try {
    const registrationId = parseInt(qrData, 10);
    if (isNaN(registrationId)) {
      return { success: false, error: "❌ Código QR inválido." };
    }

    // 1. Buscamos y marcamos la asistencia en un solo paso usando las nuevas columnas
    const query = `
      UPDATE event_registrations 
      SET 
        attended = TRUE, 
        attended_at = NOW()
      WHERE id = $1 AND payment_status = 'paid' AND attended = FALSE
      RETURNING participant_details;
    `;

    const result = await pool.query(query, [registrationId]);

    // 2. Validaciones lógicas
    if (result.rowCount === null || result.rowCount === 0) {
      // Verificamos si es que ya había marcado asistencia antes
      const checkQuery = await pool.query(
        `SELECT attended, payment_status FROM event_registrations WHERE id = $1`,
        [registrationId],
      );

      // 🔥 CORRECCIÓN: Usamos checkQuery.rows.length que SIEMPRE es un número en TypeScript
      if (checkQuery.rows.length > 0) {
        if (checkQuery.rows[0].attended === true) {
          return {
            success: false,
            error: "⚠️ Este corredor ya registró su ingreso en la partida.",
          };
        }
        if (checkQuery.rows[0].payment_status !== "paid") {
          return {
            success: false,
            error: "❌ La inscripción de este atleta no figura como pagada.",
          };
        }
      }
      return {
        success: false,
        error: "❌ Código QR no encontrado en la base de datos.",
      };
    }

    // 3. Limpiamos el caché si es que muestras métricas de asistencia en el panel
    revalidatePath("/dashboard", "layout");

    // 4. Retornamos el nombre para saludarlo en pantalla
    const pDetails = result.rows[0].participant_details || {};
    const firstName = pDetails.firstName || pDetails.first_name || "";
    const lastName = pDetails.lastName || pDetails.last_name || "";

    let name = "Corredor";
    if (firstName || lastName) {
      name = `${firstName} ${lastName}`.trim();
    }

    return {
      success: true,
      message: `✅ ¡Acceso a pista concedido a ${name}!`,
      name,
    };
  } catch (error) {
    console.error("Error en el control de asistencia:", error);
    return { success: false, error: "Error interno del servidor." };
  }
}

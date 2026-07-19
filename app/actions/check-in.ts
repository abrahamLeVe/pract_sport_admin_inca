"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export interface CheckInAthlete {
  id: number;
  first_name: string;
  last_name: string;
  document: string;
  bib_number: number | null;
  tshirt_size: string;
  status: string; // payment_status
  kit_delivered: boolean;
}

// Función para buscar rápido al corredor por DNI o Apellido
export async function searchForCheckInAction(
  eventId: number,
  query: string,
): Promise<CheckInAthlete[]> {
  try {
    const searchTerm = `%${query}%`;
    const sql = `
      SELECT 
        id, 
        bib_number,
        payment_status,
        participant_details->>'firstName' as first_name,
        participant_details->>'lastName' as last_name,
        participant_details->>'documentNumber' as document,
        participant_details->>'tshirtSize' as tshirt_size,
        COALESCE((participant_details->>'kitDelivered')::boolean, false) as kit_delivered
      FROM event_registrations
      WHERE event_id = $1
        AND (
          participant_details->>'documentNumber' ILIKE $2
          OR participant_details->>'lastName' ILIKE $2
          OR participant_details->>'firstName' ILIKE $2
        )
      LIMIT 5;
    `;
    const res = await pool.query(sql, [eventId, searchTerm]);

    return res.rows.map((row) => ({
      id: row.id,
      first_name: row.first_name,
      last_name: row.last_name,
      document: row.document,
      bib_number: row.bib_number,
      tshirt_size: row.tshirt_size || "N/A",
      status: row.payment_status,
      kit_delivered: row.kit_delivered,
    }));
  } catch (error) {
    console.error("Error buscando para check-in:", error);
    return [];
  }
}

export async function markKitDeliveredAction(
  registrationId: number,
  isDelivered: boolean,
) {
  try {
    // Si se entrega el kit, el estado es 'checked_in'.
    // Si se deshace (isDelivered = false), lo regresamos a 'approved'
    const newStatus = isDelivered ? "checked_in" : "approved";

    const sql = `
      UPDATE event_registrations
      SET 
        registration_status = $2,
        participant_details = jsonb_set(
          COALESCE(participant_details, '{}'::jsonb),
          '{kitDelivered}',
          $3::jsonb
        )
      WHERE id = $1;
    `;

    await pool.query(sql, [
      registrationId,
      newStatus,
      isDelivered ? "true" : "false",
    ]);

    return { success: true };
  } catch (error) {
    console.error("Error actualizando kit:", error);
    return { success: false, message: "Error al actualizar." };
  }
}

export async function processCheckInAction(eventId: number, qrData: string) {
  try {
    // 1. Validar que el QR sea un ID válido (el ID de la inscripción)
    const registrationId = parseInt(qrData, 10);
    if (isNaN(registrationId)) {
      return {
        success: false,
        error: "El código QR no tiene un formato válido para este evento.",
      };
    }

    // 2. Consulta SQL REAL cruzando todas las tablas
    const query = `
      SELECT 
        r.id, 
        r.registration_status, 
        r.payment_status, 
        r.bib_number,
        r.participant_details,
        u.name as auth_name,
        COALESCE(p.tshirt_size, r.participant_details->>'tshirtSize') as tshirt_size,
        md.name as distance_name,
        mac.name as age_category_name,
        COALESCE((r.participant_details->>'kitDelivered')::boolean, false) as kit_delivered
      FROM event_registrations r
      LEFT JOIN users u ON r.user_id = u.id -- 🔥 CORREGIDO: Ahora es LEFT JOIN
      LEFT JOIN user_profiles p ON u.id = p.user_id
      LEFT JOIN event_categories ec ON r.category_id = ec.id
      LEFT JOIN master_distances md ON ec.distance_id = md.id
      LEFT JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE r.id = $1 
        AND r.event_id = $2 
        AND r.deleted_at IS NULL;
    `;

    const res = await pool.query(query, [registrationId, eventId]);
    const registration = res.rows[0];

    // 3. Validaciones de negocio estrictas
    if (!registration) {
      return {
        success: false,
        error:
          "No se encontró inscripción válida con este código para esta carrera.",
      };
    }

    if (registration.payment_status !== "paid") {
      return {
        success: false,
        error: "Esta inscripción aún no figura como pagada. Dirigir a caja.",
      };
    }

    if (
      registration.registration_status === "checked_in" ||
      registration.kit_delivered
    ) {
      return {
        success: false,
        error: "Este atleta ya recogió su kit anteriormente.",
      };
    }
    const isPaid = registration.payment_status === "paid";
    // 4. Extraemos y formateamos la data para la UI (Priorizando el JSONB)
    const pDetails = registration.participant_details || {};
    const firstName = pDetails.firstName || pDetails.first_name || "";
    const lastName = pDetails.lastName || pDetails.last_name || "";

    let athleteName = registration.auth_name || "Atleta";
    if (firstName || lastName) {
      // Formateamos como "Apellido, Nombre"
      athleteName = `${lastName}, ${firstName}`
        .replace(/^,\s*|\s*,$/g, "")
        .trim();
    }

    const categoryName =
      `${registration.distance_name || ""} ${registration.age_category_name || ""}`.trim() ||
      "General";

    // 5. Actualizamos TANTO el estado general como el JSONB
    const updateQuery = `
      UPDATE event_registrations 
      SET 
        registration_status = 'checked_in',
        participant_details = jsonb_set(COALESCE(participant_details, '{}'::jsonb), '{kitDelivered}', 'true'::jsonb)
      WHERE id = $1;
    `;
    await pool.query(updateQuery, [registrationId]);

    // 6. Refrescar la caché
    revalidatePath(`/dashboard/events/edit/${eventId}/check-in`);

    // 7. Retornar éxito
    return {
      success: true,
      requiresAttention: !isPaid, // 🔥 Esta bandera es clave
      errorMessage: !isPaid
        ? "Atleta con pago pendiente. Dirigir a caja."
        : null,
      athleteName: athleteName,
      tshirtSize: registration.tshirt_size || "N/A",
      categoryName: categoryName,
      bibNumber: registration.bib_number,
    };
  } catch (error) {
    console.error("Error procesando QR en BD:", error);
    return {
      success: false,
      error: "Error interno del servidor al conectar con la base de datos.",
    };
  }
}

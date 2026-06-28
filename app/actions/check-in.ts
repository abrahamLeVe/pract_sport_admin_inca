"use server";
import pool from "@/lib/db";
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
    const sql = `
      UPDATE event_registrations
      SET participant_details = jsonb_set(
        participant_details,
        '{kitDelivered}',
        $2::jsonb
      )
      WHERE id = $1;
    `;
    // Pasamos el booleano como texto ('true' o 'false') para que postgres lo entienda como JSON
    await pool.query(sql, [registrationId, isDelivered ? "true" : "false"]);
    return { success: true };
  } catch (error) {
    console.error("Error actualizando kit:", error);
    return { success: false, message: "Error al actualizar." };
  }
}

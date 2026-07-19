import pool from "@/lib/db";
import { EventRegistration } from "@/validations/registrations";

export async function getRegistrations(
  eventId?: number,
): Promise<EventRegistration[]> {
  try {
    let query = `
      SELECT 
        r.*,
        e.title as event_title,
        CONCAT(md.name, ' - ', mac.name, ' - ', mg.name) as category_name
      FROM event_registrations r
      JOIN events e ON r.event_id = e.id
      JOIN event_categories ec ON r.category_id = ec.id
      LEFT JOIN master_distances md ON ec.distance_id = md.id
      LEFT JOIN master_age_categories mac ON ec.age_category_id = mac.id
      LEFT JOIN master_genders mg ON ec.gender_id = mg.id
      WHERE r.deleted_at IS NULL  -- 🔥 1. Ocultamos las inscripciones borradas
    `;

    const values: any[] = [];

    // 🔥 2. Cambiamos WHERE por AND porque ya pusimos un WHERE arriba
    if (eventId) {
      query += ` AND r.event_id = $1`;
      values.push(eventId);
    }

    query += ` ORDER BY r.created_at DESC`;

    const { rows } = await pool.query(query, values);
    return rows as EventRegistration[];
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return [];
  }
}

// Obtener una inscripción específica para evaluarla
export async function getRegistrationById(
  id: number,
): Promise<EventRegistration | null> {
  try {
    const query = `
      SELECT 
        r.*,
        e.title as event_title,
        CONCAT(md.name, ' - ', mac.name, ' - ', mg.name) as category_name
      FROM event_registrations r
      JOIN events e ON r.event_id = e.id
      JOIN event_categories ec ON r.category_id = ec.id
      LEFT JOIN master_distances md ON ec.distance_id = md.id
      LEFT JOIN master_age_categories mac ON ec.age_category_id = mac.id
      LEFT JOIN master_genders mg ON ec.gender_id = mg.id
      WHERE r.id = $1 AND r.deleted_at IS NULL -- 🔥 3. Si está borrada, devuelve null (404)
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) return null;
    return rows[0] as EventRegistration;
  } catch (error) {
    console.error("Error fetching registration by id:", error);
    return null;
  }
}

export async function getNextAvailableBib(eventId: number): Promise<number> {
  try {
    // 🔥 CONSULTA AVANZADA: Busca el primer "hueco" en la secuencia de números
    const query = `
      SELECT t1.bib_number + 1 AS next_bib
      FROM event_registrations t1
      WHERE NOT EXISTS (
          SELECT 1 FROM event_registrations t2 
          WHERE t2.bib_number = t1.bib_number + 1 
          AND t2.event_id = $1
          AND t2.deleted_at IS NULL -- 🔥 4. Si el dorsal siguiente fue borrado, lo consideramos "libre"
      )
      AND t1.event_id = $1
      AND t1.bib_number IS NOT NULL
      AND t1.deleted_at IS NULL -- 🔥 5. No calculamos a partir de dorsales borrados
      ORDER BY t1.bib_number ASC
      LIMIT 1
    `;
    const { rows } = await pool.query(query, [eventId]);

    // Si encontró un hueco (ej. falta el 102), o si encontró el límite superior (ej. 104)
    if (rows.length > 0) {
      return parseInt(rows[0].next_bib, 10);
    }

    // Si la tabla no tiene dorsales asignados, sugerimos el 1 (o el que tú decidas)
    return 1;
  } catch (error) {
    console.error("Error fetching next bib:", error);
    return 1;
  }
}

export async function getRegistrationsForExport(eventId: number) {
  const query = `
    SELECT 
      r.bib_number AS "Dorsal",
      r.participant_details->>'firstName' AS "Nombres",
      r.participant_details->>'lastName' AS "Apellidos",
      r.participant_details->>'documentNumber' AS "DNI",
      r.participant_details->>'phone' AS "Teléfono",
      r.participant_details->>'tshirtSize' AS "Talla de Polo",
      COALESCE(md.name, 'General') AS "Distancia",
      r.registration_status AS "Estado de Inscripción",
      r.payment_status AS "Estado de Pago"
    FROM event_registrations r
    LEFT JOIN event_categories ec ON r.category_id = ec.id
    LEFT JOIN master_distances md ON ec.distance_id = md.id
    WHERE r.event_id = $1 AND r.deleted_at IS NULL
    ORDER BY r.bib_number ASC NULLS LAST;
  `;

  const { rows } = await pool.query(query, [eventId]);
  return rows;
}

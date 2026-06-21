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
    `;

    // Valores dinámicos para proteger de inyección SQL
    const values: any[] = [];

    // Si nos pasan un ID de evento, filtramos la consulta
    if (eventId) {
      query += ` WHERE r.event_id = $1`;
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

// Obtener una inscripción específica para evaluarla (Para la vista de Detalles)
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
      WHERE r.id = $1
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
      )
      AND t1.event_id = $1
      AND t1.bib_number IS NOT NULL
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

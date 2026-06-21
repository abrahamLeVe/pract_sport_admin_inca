import { EventTableItem } from "@/validations/events";
import pool from "../db";

export async function getEvents(): Promise<EventTableItem[]> {
  try {
    const query = `
      SELECT *
      FROM events
      ORDER BY event_date DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      // Consideramos activo si está 'published' o 'activo'
      is_active: row.status === "published" || row.status === "activo",
    })) as EventTableItem[];
  } catch (error) {
    console.error("❌ Error en getEvents:", error);
    return [];
  }
}

export async function getEventByIdAction(id: number) {
  try {
    // Solo traemos los datos de la tabla events, las categorías irán aparte o cruzadas en la acción de edición
    const query = `
      SELECT 
        id, 
        title, 
        description, 
        event_date, 
        location_name, 
        latitude, 
        longitude, 
        route_geojson,
        event_type_id, 
        status, 
        image_url
      FROM events 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener evento por ID:", error);
    return null;
  }
}

export async function getIdsTitlesEventsAction() {
  try {
    const query = `
    select id, title
    FROM events`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error al obtener los eventos:`, error);
    return [];
  }
}

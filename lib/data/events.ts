import { EventTableItem } from "@/validations/events";
import pool from "../db";

export async function getEvents(): Promise<EventTableItem[]> {
  try {
    const query = `SELECT * FROM events WHERE deleted_at IS NULL ORDER BY event_date DESC`;
    const { rows } = await pool.query(query);
    return rows.map((row) => ({
      ...row,
      is_active: row.status === "published" || row.status === "activo",
    })) as EventTableItem[];
  } catch (error) {
    console.error("❌ Error en getEvents:", error);
    return [];
  }
}

export async function getEventByIdAction(id: number) {
  try {
    const query = `
      SELECT id, title, slug, description, event_date, location_name, latitude, longitude, route_geojson, event_type_id, status, image_url
      FROM events WHERE id = $1 AND deleted_at IS NULL
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
    const query = `SELECT id, title, slug FROM events WHERE deleted_at IS NULL`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error al obtener los eventos:`, error);
    return [];
  }
}

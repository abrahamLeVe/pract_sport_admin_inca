import { EventTableItem, EventMediaRow } from "@/validations/events"; // 🔥 Asegúrate de tener la ruta correcta
import pool from "../db";

export async function getEvents(): Promise<EventTableItem[]> {
  try {
    const query = `
      SELECT *
      FROM events
      WHERE deleted_at IS NULL 
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
        slug, -- 🔥 Agregado para que viaje al formulario de edición
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
      WHERE id = $1 AND deleted_at IS NULL
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
    SELECT id, title, slug -- 🔥 Agregado el slug: muy útil para armar enlaces rápidos en el frontend
    FROM events
    WHERE deleted_at IS NULL`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error al obtener los eventos:`, error);
    return [];
  }
}

// ============================================================================
// 🔥 NUEVO: OBTENER GALERÍA MULTIMEDIA DEL EVENTO
// ============================================================================
export async function getEventMediaAction(
  eventId: number,
): Promise<EventMediaRow[]> {
  try {
    const query = `
      SELECT 
        id, 
        event_id, 
        media_type, 
        media_url, 
        media_key, 
        alt_text, 
        display_order, 
        created_at
      FROM event_media
      WHERE event_id = $1
      ORDER BY display_order ASC, created_at ASC
    `;
    const result = await pool.query(query, [eventId]);
    return result.rows as EventMediaRow[];
  } catch (error) {
    console.error("❌ Error al obtener los medios del evento:", error);
    return [];
  }
}

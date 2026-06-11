import pool from "../db";

export async function getEventsAction({
  query,
  page,
  limit,
}: {
  query: string;
  page: number;
  limit: number;
}) {
  try {
    const offset = (page - 1) * limit;

    // 🔥 USAMOS JOINS Y SUM PARA OBTENER LOS DATOS RELACIONALES
    const eventsQuery = `
      SELECT 
        e.id, 
        e.title, 
        e.event_date, 
        e.location_name AS location, 
        met.name AS event_type, 
        e.status, 
        e.image_url,
        COALESCE(SUM(ec.cupos), 0) AS max_participants
      FROM events e
      LEFT JOIN master_event_types met ON e.event_type_id = met.id
      LEFT JOIN event_categories ec ON e.id = ec.event_id
      WHERE e.title ILIKE $1 OR e.location_name ILIKE $1
      GROUP BY e.id, met.name
      ORDER BY e.event_date DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM events
      WHERE title ILIKE $1 OR location_name ILIKE $1
    `;

    const searchQuery = `%${query}%`;

    const [eventsResult, countResult] = await Promise.all([
      pool.query(eventsQuery, [searchQuery, limit, offset]),
      pool.query(countQuery, [searchQuery]),
    ]);

    const totalPages = Math.ceil(Number(countResult.rows[0].count) / limit);

    return {
      events: eventsResult.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener eventos:", error);
    return { events: [], totalPages: 0 };
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

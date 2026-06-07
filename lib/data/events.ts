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

    const eventsQuery = `
      SELECT id, title, event_date, location, event_type, status, max_participants, image_url
      FROM events
      WHERE title ILIKE $1 OR location ILIKE $1
      ORDER BY event_date DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM events
      WHERE title ILIKE $1 OR location ILIKE $1
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
    const query = `
      SELECT id, title, description, event_date, location, event_type, distances, max_participants, status, image_url, image_key
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

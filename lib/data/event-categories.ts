import pool from "../db";

export async function getEventCategoriesAction(event_id: number) {
  try {
    const query = `
      SELECT id, event_id, name, min_age, max_age, price, cupos
      FROM event_categories
      WHERE event_id = $1
      ORDER BY name ASC
    `;
    const result = await pool.query(query, [event_id]);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener categorías del evento:", error);
    return [];
  }
}

export async function getEventCategoryByIdAction(id: number) {
  try {
    const query = `
      SELECT id, event_id, name, min_age, max_age, price, cupos
      FROM event_categories
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener categoría por ID:", error);
    return null;
  }
}

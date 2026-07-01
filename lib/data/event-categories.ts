import pool from "../db";

export async function getEventCategoriesAction(event_id: number) {
  try {
    const query = `
      SELECT 
        ec.id, 
        ec.event_id, 
        ec.distance_id, md.name AS distance_name,
        ec.gender_id, mg.name AS gender_name,
        ec.age_category_id, mac.name AS age_category_name,
        ec.applied_min_age, 
        ec.applied_max_age, 
        ec.price, 
        ec.cupos,
        -- 🔥 FIX: Ponemos un 0 temporal hasta que construyas tu módulo y tabla de inscripciones.
        0 AS registered_count
      FROM event_categories ec
      LEFT JOIN master_distances md ON ec.distance_id = md.id
      LEFT JOIN master_genders mg ON ec.gender_id = mg.id
      LEFT JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE ec.event_id = $1 AND ec.deleted_at IS NULL 
      ORDER BY md.name ASC, mg.name ASC, ec.applied_min_age ASC
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
      SELECT 
        id, 
        event_id, 
        distance_id, 
        gender_id, 
        age_category_id, 
        applied_min_age, 
        applied_max_age, 
        price, 
        cupos
      FROM event_categories
      WHERE id = $1 AND deleted_at IS NULL 
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener categoría por ID:", error);
    return null;
  }
}

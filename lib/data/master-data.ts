import pool from "../db";

// ============================================================================
// 1. DISTANCIAS (Master Distances)
// ============================================================================

export async function getMasterDistancesAction({
  query,
  page = 1,
  limit = 5,
}: {
  query: string;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  try {
    const dataQuery = `
      SELECT * FROM master_distances
      WHERE name ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM master_distances
      WHERE name ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalDistances = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalDistances / limit);

    return {
      distances: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener distancias:", error);
    throw new Error("No se pudieron cargar las distancias.");
  }
}

export async function getMasterDistanceByIdAction(id: number) {
  try {
    const query = `SELECT id, name FROM master_distances WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener distancia por ID:", error);
    return null;
  }
}

export async function getAllMasterDistancesAction() {
  try {
    const query = `SELECT id, name FROM master_distances ORDER BY id ASC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las distancias:", error);
    return [];
  }
}

// ============================================================================
// 2. GÉNEROS (Master Genders)
// ============================================================================

export async function getMasterGendersAction({
  query,
  page = 1,
  limit = 5,
}: {
  query: string;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  try {
    const dataQuery = `
      SELECT * FROM master_genders
      WHERE name ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM master_genders
      WHERE name ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalGenders = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalGenders / limit);

    return {
      genders: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener géneros:", error);
    throw new Error("No se pudieron cargar los géneros.");
  }
}

export async function getMasterGenderByIdAction(id: number) {
  try {
    const query = `SELECT id, name FROM master_genders WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener género por ID:", error);
    return null;
  }
}

export async function getAllMasterGendersAction() {
  try {
    const query = `SELECT id, name FROM master_genders ORDER BY id ASC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todos los géneros:", error);
    return [];
  }
}

// ============================================================================
// 3. CATEGORÍAS DE EDAD (Master Age Categories)
// ============================================================================

export async function getMasterAgeCategoriesAction({
  query,
  page = 1,
  limit = 5,
}: {
  query: string;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  try {
    const dataQuery = `
      SELECT * FROM master_age_categories
      WHERE name ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM master_age_categories
      WHERE name ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalAges = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalAges / limit);

    return {
      ageCategories: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener categorías de edad:", error);
    throw new Error("No se pudieron cargar las categorías de edad.");
  }
}

export async function getMasterAgeCategoryByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, default_min_age, default_max_age 
      FROM master_age_categories 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener categoría de edad por ID:", error);
    return null;
  }
}

export async function getAllMasterAgeCategoriesAction() {
  try {
    const query = `
      SELECT id, name, default_min_age, default_max_age 
      FROM master_age_categories 
      ORDER BY default_min_age ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las categorías de edad:", error);
    return [];
  }
}

// ============================================================================
// 4. TIPOS DE EVENTO (Master Event Types)
// ============================================================================

export async function getMasterEventTypesAction({
  query,
  page = 1,
  limit = 5,
}: {
  query: string;
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  try {
    const dataQuery = `
      SELECT * FROM master_event_types
      WHERE name ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM master_event_types
      WHERE name ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalEventTypes = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalEventTypes / limit);

    return {
      eventTypes: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener tipos de evento:", error);
    throw new Error("No se pudieron cargar los tipos de evento.");
  }
}

export async function getMasterEventTypeByIdAction(id: number) {
  try {
    const query = `SELECT id, name FROM master_event_types WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener tipo de evento por ID:", error);
    return null;
  }
}

export async function getAllMasterEventTypesAction() {
  try {
    const query = `SELECT id, name FROM master_event_types ORDER BY id ASC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todos los tipos de evento:", error);
    return [];
  }
}

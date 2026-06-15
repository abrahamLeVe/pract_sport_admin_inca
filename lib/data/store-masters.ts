import pool from "../db";

// ============================================================================
// 1. COLORES (Master Colors)
// ============================================================================

export async function getMasterColorsAction({
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
      SELECT * FROM master_colors
      WHERE name ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM master_colors
      WHERE name ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalColors = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalColors / limit);

    return {
      colors: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener colores:", error);
    throw new Error("No se pudieron cargar los colores.");
  }
}

export async function getMasterColorByIdAction(id: number) {
  try {
    const query = `SELECT id, name, hex_code FROM master_colors WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener color por ID:", error);
    return null;
  }
}

export async function getAllMasterColorsAction() {
  try {
    const query = `SELECT id, name, hex_code FROM master_colors ORDER BY name ASC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todos los colores:", error);
    return [];
  }
}

// ============================================================================
// 2. TALLAS (Master Sizes)
// ============================================================================

export async function getMasterSizesAction({
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
      SELECT * FROM master_sizes
      WHERE name ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM master_sizes
      WHERE name ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalSizes = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalSizes / limit);

    return {
      sizes: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener tallas:", error);
    throw new Error("No se pudieron cargar las tallas.");
  }
}

export async function getMasterSizeByIdAction(id: number) {
  try {
    const query = `SELECT id, name, category FROM master_sizes WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener talla por ID:", error);
    return null;
  }
}

export async function getAllMasterSizesAction() {
  try {
    // 🔥 Ordenamos primero por categoría y luego por nombre para que sea más fácil de buscar
    const query = `SELECT id, name, category FROM master_sizes ORDER BY category ASC, name ASC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las tallas:", error);
    return [];
  }
}

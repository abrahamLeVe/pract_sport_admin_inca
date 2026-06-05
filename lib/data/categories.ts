import pool from "../db";

export async function getCategoriesAction({
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
      SELECT * FROM categories
      WHERE name ILIKE $1 OR slug ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM categories
      WHERE name ILIKE $1 OR slug ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalCategories = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCategories / limit);

    return {
      categories: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    throw new Error("No se pudieron cargar las categorías.");
  }
}

export async function getCategoryByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, slug, description, image_url, status
      FROM categories 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener categoría por ID:", error);
    return null;
  }
}

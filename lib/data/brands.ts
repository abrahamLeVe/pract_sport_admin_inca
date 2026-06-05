import pool from "../db";

export async function getBrandsAction({
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
      SELECT * FROM brands
      WHERE name ILIKE $1 OR slug ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const dataValues = [`%${query}%`, limit, offset];
    const result = await pool.query(dataQuery, dataValues);

    const countQuery = `
      SELECT COUNT(*) 
      FROM brands
      WHERE name ILIKE $1 OR slug ILIKE $1
    `;
    const countValues = [`%${query}%`];
    const countResult = await pool.query(countQuery, countValues);

    const totalBrands = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalBrands / limit);

    return {
      brands: result.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener marcas:", error);
    throw new Error("No se pudieron cargar las marcas.");
  }
}

export async function getBrandByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, slug, description, image_url, status
      FROM brands 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener marca por ID:", error);
    return null;
  }
}

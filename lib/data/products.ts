import pool from "../db";

export async function getProductsAction({
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

    const productsQuery = `
      SELECT id, name, slug, price, stock, status, images
      FROM products
      WHERE name ILIKE $1 OR slug ILIKE $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const countQuery = `
      SELECT COUNT(*)
      FROM products
      WHERE name ILIKE $1 OR slug ILIKE $1
    `;

    const searchQuery = `%${query}%`;

    const [productsResult, countResult] = await Promise.all([
      pool.query(productsQuery, [searchQuery, limit, offset]),
      pool.query(countQuery, [searchQuery]),
    ]);

    const totalPages = Math.ceil(Number(countResult.rows[0].count) / limit);

    return {
      products: productsResult.rows,
      totalPages,
    };
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    return { products: [], totalPages: 0 };
  }
}

export async function getProductByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, slug, description, price, discount_price, stock, category_id, brand_id, images, status
      FROM products 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener producto por ID:", error);
    return null;
  }
}

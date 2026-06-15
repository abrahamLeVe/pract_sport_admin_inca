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
      SELECT 
        p.id, 
        p.name, 
        p.slug, 
        p.price, 
        p.stock, 
        p.status, 
        p.images, 
        p.track_stock,
        -- 🔥 1. Detectamos si tiene variantes en general
        EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id = p.id) as has_variants,
        -- 🔥 2. Detectamos si AL MENOS UNA variante es de stock infinito
        EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.track_stock = false) as has_infinite_variants
      FROM products p
      WHERE p.name ILIKE $1 OR p.slug ILIKE $1
      ORDER BY p.created_at DESC
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
      SELECT 
        p.id, p.name, p.slug, p.description, p.price, p.discount_price, 
        p.stock, p.category_id, p.brand_id, p.images, p.status, p.track_stock,
        EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id = p.id) as has_variants
      FROM products p
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener producto por ID:", error);
    return null;
  }
}

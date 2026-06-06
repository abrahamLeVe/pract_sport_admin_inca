import pool from "../db";

export async function getVariantsByProductIdAction(productId: number) {
  try {
    const query = `
      SELECT id, product_id, size, color, sku, stock, status
      FROM product_variants
      WHERE product_id = $1
      ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [productId]);

    // Retornamos todas las variantes de este producto
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener variantes del producto:", error);
    return [];
  }
}

export async function getVariantByIdAction(id: number) {
  try {
    const query = `
      SELECT id, product_id, size, color, sku, stock, status
      FROM product_variants 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener variante por ID:", error);
    return null;
  }
}

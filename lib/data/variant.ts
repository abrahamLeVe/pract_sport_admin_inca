import pool from "../db";

export async function getVariantsByProductIdAction(productId: number) {
  try {
    const query = `
      SELECT 
        pv.id, 
        pv.product_id, 
        pv.size_id, 
        ms.name AS size_name,
        pv.color_id, 
        mc.name AS color_name,
        mc.hex_code AS color_hex,
        pv.sku, 
        pv.stock, 
        pv.status,
        pv.track_stock -- 🔥 1. Agregamos el campo aquí
      FROM product_variants pv
      LEFT JOIN master_sizes ms ON pv.size_id = ms.id
      LEFT JOIN master_colors mc ON pv.color_id = mc.id
      WHERE pv.product_id = $1
      ORDER BY pv.created_at ASC
    `;
    const result = await pool.query(query, [productId]);

    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener variantes del producto:", error);
    return [];
  }
}

export async function getVariantByIdAction(id: number) {
  try {
    const query = `
      SELECT 
        pv.id, 
        pv.product_id, 
        pv.size_id, 
        ms.name AS size_name,
        pv.color_id, 
        mc.name AS color_name,
        mc.hex_code AS color_hex,
        pv.sku, 
        pv.stock, 
        pv.status,
        pv.track_stock -- 🔥 2. Y también aquí
      FROM product_variants pv
      LEFT JOIN master_sizes ms ON pv.size_id = ms.id
      LEFT JOIN master_colors mc ON pv.color_id = mc.id
      WHERE pv.id = $1
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener variante por ID:", error);
    return null;
  }
}

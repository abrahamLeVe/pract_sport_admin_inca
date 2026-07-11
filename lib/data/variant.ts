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
        pv.track_stock
      FROM product_variants pv
      LEFT JOIN master_sizes ms ON pv.size_id = ms.id
      LEFT JOIN master_colors mc ON pv.color_id = mc.id
      WHERE pv.product_id = $1 AND pv.deleted_at IS NULL
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
        pv.track_stock
      FROM product_variants pv
      LEFT JOIN master_sizes ms ON pv.size_id = ms.id
      LEFT JOIN master_colors mc ON pv.color_id = mc.id
      WHERE pv.id = $1 AND pv.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener variante por ID:", error);
    return null;
  }
}

export async function getTrashedProductByIdAction(id: number) {
  try {
    const query = `
      SELECT p.*, c.name as category_name, b.name as brand_name,
      -- Obtenemos el usuario que realizó el soft delete
      (SELECT u.name FROM audit a 
       JOIN users u ON a.user_id = u.id 
       WHERE a.entity_table = 'products' 
       AND a.entity_id = p.id 
       AND a.action = 'SOFT_DELETE' 
       ORDER BY a.created_at DESC LIMIT 1) as deleted_by_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.id = $1 AND p.deleted_at IS NOT NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error en getTrashedProductByIdAction:", error);
    return null;
  }
}

export async function getTrashedVariantsByProductId(productId: number) {
  try {
    const query = `
      SELECT pv.*, ms.name AS size_name, mc.name AS color_name, mc.hex_code
      FROM product_variants pv
      LEFT JOIN master_sizes ms ON pv.size_id = ms.id
      LEFT JOIN master_colors mc ON pv.color_id = mc.id
      WHERE pv.product_id = $1 AND pv.deleted_at IS NOT NULL
    `;
    const { rows } = await pool.query(query, [productId]);
    return rows;
  } catch (error) {
    return [];
  }
}

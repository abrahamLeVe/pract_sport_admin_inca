import { ProductTableItem, TrashedProductDetail } from "@/validations/products";
import pool from "../db";

// 🔥 Ayudante interno para no repetir la lógica de mapeo
const mapProduct = (row: any): ProductTableItem => ({
  ...row,
  price: parseFloat(row.price),
  discount_price: row.discount_price ? parseFloat(row.discount_price) : null,
  is_active: row.status === "activo",
  // 🔥 ACTUALIZADO: Ya no parseamos un JSON complejo, solo leemos la nueva columna directa
  main_image: row.image_url || null,
});

// 1. OBTENER PRODUCTOS ACTIVOS
export async function getProducts(): Promise<ProductTableItem[]> {
  try {
    const query = `
      SELECT p.*, 
             c.name as category_name, 
             b.name as brand_name,
             g.name as gender_name, -- 🔥 Agregado para el JOIN de géneros
             EXISTS(SELECT 1 FROM product_variants pv WHERE pv.product_id = p.id AND pv.deleted_at IS NULL) as has_variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN master_genders g ON p.gender_id = g.id -- 🔥 Unimos la tabla de géneros
      WHERE p.deleted_at IS NULL 
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows.map(mapProduct);
  } catch (error) {
    console.error("❌ Error en getProducts:", error);
    return [];
  }
}
// 2. OBTENER PRODUCTO POR ID (ACTIVO)
export async function getProductByIdAction(id: number) {
  try {
    const query = `
      SELECT p.*,
             EXISTS(SELECT 1 FROM product_variants v WHERE v.product_id = p.id AND v.deleted_at IS NULL) as has_variants,
             -- 🔥 AHORA SÍ ENVIAMOS EL TAMAÑO Y EL NOMBRE AL FRONTEND
             COALESCE(
               (SELECT json_agg(json_build_object(
                  'url', m.media_url, 
                  'key', m.media_key,
                  'size_bytes', m.size_bytes,
                  'file_name', m.file_name
                )) 
                FROM media_links ml 
                JOIN media m ON ml.media_id = m.id 
                WHERE ml.model_type = 'product' AND ml.model_id = p.id), 
               '[]'::json
             ) as images
      FROM products p
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener producto por ID:", error);
    return null;
  }
}

// 3. OBTENER PRODUCTOS EN PAPELERA
export async function getTrashedProducts(): Promise<ProductTableItem[]> {
  try {
    const query = `
      SELECT p.*, 
             c.name as category_name, 
             b.name as brand_name,
             g.name as gender_name, -- 🔥 Agregado
             (SELECT COUNT(*) > 0 FROM product_variants pv WHERE pv.product_id = p.id) as has_variants
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN master_genders g ON p.gender_id = g.id -- 🔥 Agregado
      WHERE p.deleted_at IS NOT NULL 
      ORDER BY p.deleted_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows.map(mapProduct);
  } catch (error) {
    console.error("❌ Error en getTrashedProducts:", error);
    return [];
  }
}

// 4. OBTENER DETALLE DE PRODUCTO EN PAPELERA (PARA VISTA PREVIA)
export async function getTrashedProductByIdAction(id: number) {
  try {
    const query = `
      SELECT 
        p.*, 
        c.name as category_name, 
        b.name as brand_name,
        g.name as gender_name,
        u.name as deleted_by_name,
        a.created_at as deleted_at_audit,
        -- 🔥 ACTUALIZADO AQUÍ TAMBIÉN PARA CONSISTENCIA
        COALESCE(
          (SELECT json_agg(json_build_object(
              'url', m.media_url, 
              'key', m.media_key,
              'size_bytes', m.size_bytes,
              'file_name', m.file_name
           )) 
           FROM media_links ml 
           JOIN media m ON ml.media_id = m.id 
           WHERE ml.model_type = 'product' AND ml.model_id = p.id), 
          '[]'::json
        ) as images
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN master_genders g ON p.gender_id = g.id
      LEFT JOIN audit_logs a ON a.record_id = p.id::text 
        AND a.table_name = 'products' 
        AND a.action = 'SOFT_DELETE'
      LEFT JOIN users u ON a.user_id = u.id
      WHERE p.id = $1 AND p.deleted_at IS NOT NULL
      ORDER BY a.created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener detalle de papelera:", error);
    return null;
  }
}

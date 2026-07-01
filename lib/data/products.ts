import { ProductTableItem } from "@/validations/products";
import pool from "../db";

export async function getProducts(): Promise<ProductTableItem[]> {
  try {
    const query = `
      SELECT 
        p.*,
        c.name as category_name,
        b.name as brand_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN brands b ON p.brand_id = b.id
      WHERE p.deleted_at IS NULL 
      ORDER BY p.created_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => {
      // Extraemos la primera imagen de la galería (si existe)
      let main_image = null;
      if (row.images && Array.isArray(row.images) && row.images.length > 0) {
        main_image = row.images[0].url;
      }

      return {
        ...row,
        price: parseFloat(row.price),
        discount_price: row.discount_price
          ? parseFloat(row.discount_price)
          : null,
        is_active: row.status === "activo",
        main_image,
      };
    }) as ProductTableItem[];
  } catch (error) {
    console.error("❌ Error en getProducts:", error);
    return [];
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
      WHERE p.id = $1 AND p.deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener producto por ID:", error);
    return null;
  }
}

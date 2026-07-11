import { Category } from "@/validations/categories";
import pool from "../db";

export async function getCategories(): Promise<Category[]> {
  try {
    const query = `
      SELECT *
      FROM categories
      WHERE deleted_at IS NULL    -- 🔥 ESTA ES LA MAGIA
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      is_active: row.status === "activo",
    })) as Category[];
  } catch (error) {
    console.error("❌ Error en getCategories:", error);
    return [];
  }
}
export async function getCategoryByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, slug, description, image_url, status
      FROM categories 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener categoría por ID:", error);
    return null;
  }
}

export async function getTrashedCategories(): Promise<Category[]> {
  try {
    const query = `
      SELECT *, deleted_at as deleted_at_audit
      FROM categories
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      is_active: row.status === "activo",
    })) as Category[];
  } catch (error) {
    console.error("❌ Error en getTrashedCategories:", error);
    return [];
  }
}

export async function getTrashedCategoryByIdAction(id: number) {
  try {
    const query = `
      SELECT 
        c.*, 
        c.deleted_at as deleted_at_audit,
        u.name as deleted_by_name
      FROM categories c
      LEFT JOIN audit_logs al ON al.record_id = c.id::text 
         AND al.table_name = 'categories' 
         AND al.action IN ('SOFT_DELETE', 'BULK_SOFT_DELETE')
      LEFT JOIN users u ON al.user_id = u.id
      WHERE c.id = $1
      ORDER BY al.created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error(
      `❌ Error al obtener la categoría de la papelera ${id}:`,
      error,
    );
    return null;
  }
}

export async function getProductsByCategoryId(categoryId: number) {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        stock, 
        status, 
        deleted_at
      FROM products 
      WHERE category_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [categoryId]);
    return rows;
  } catch (error) {
    console.error(
      `❌ Error al obtener productos asociados a la categoría ${categoryId}:`,
      error,
    );
    return [];
  }
}

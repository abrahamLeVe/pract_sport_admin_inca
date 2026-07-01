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

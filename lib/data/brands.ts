import { Brand } from "@/validations/brands";
import pool from "../db";

export async function getBrands(): Promise<Brand[]> {
  try {
    const query = `
      SELECT *
      FROM brands
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      is_active: row.status === "activo",
    })) as Brand[];
  } catch (error) {
    console.error("❌ Error en getBrands:", error);
    return [];
  }
}

export async function getBrandByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, slug, description, image_url, status
      FROM brands 
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener marca por ID:", error);
    return null;
  }
}

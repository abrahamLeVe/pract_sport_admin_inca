import { Banner } from "@/validations/banners";
import pool from "../db";

export async function getBanners(): Promise<Banner[]> {
  try {
    const query = `
      SELECT *
      FROM banners
      WHERE deleted_at IS NULL 
      ORDER BY sort_order ASC, created_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      is_active: row.status === "activo",
    })) as Banner[];
  } catch (error) {
    console.error("❌ Error en getBanners:", error);
    return [];
  }
}

export async function getBannerByIdAction(id: number) {
  try {
    const query = `
      SELECT id, title, subtitle, image_url, link_url, type, event_id, status, sort_order, start_date, end_date
      FROM banners
      WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`❌ Error al obtener el banner ${id}:`, error);
    return null;
  }
}

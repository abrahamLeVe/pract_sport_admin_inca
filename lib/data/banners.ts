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

export async function getTrashedBanners() {
  try {
    const query = `
      SELECT *
      FROM banners
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  } catch (error) {
    console.error("❌ Error en getTrashedBanners:", error);
    return [];
  }
}

export async function getTrashedBannerByIdAction(id: number) {
  try {
    const query = `
      SELECT 
        b.*, 
        b.deleted_at as deleted_at_audit,
        e.title as event_name,
        u.name as deleted_by_name
      FROM banners b
      LEFT JOIN events e ON b.event_id = e.id
      -- Buscamos en el log de auditoría quién hizo el borrado lógico
      LEFT JOIN audit_logs al ON al.record_id = b.id::text 
         AND al.table_name = 'banners' 
         AND al.action = 'SOFT_DELETE'
      LEFT JOIN users u ON al.user_id = u.id
      WHERE b.id = $1
      ORDER BY al.created_at DESC -- Por si hubo varios borrados/restauraciones, tomamos el más reciente
      LIMIT 1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`❌ Error al obtener el banner de la papelera ${id}:`, error);
    return null;
  }
}

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

export async function getTrashedBrands(): Promise<Brand[]> {
  try {
    const query = `
      SELECT *, deleted_at as deleted_at_audit
      FROM brands
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      is_active: row.status === "activo",
    })) as Brand[];
  } catch (error) {
    console.error("❌ Error en getTrashedBrands:", error);
    return [];
  }
}

export async function getTrashedBrandByIdAction(id: number) {
  try {
    const query = `
      SELECT 
        b.*, 
        b.deleted_at as deleted_at_audit,
        u.name as deleted_by_name
      FROM brands b
      LEFT JOIN audit_logs al ON al.record_id = b.id::text 
         AND al.table_name = 'brands' 
         AND al.action IN ('SOFT_DELETE', 'BULK_SOFT_DELETE')
      LEFT JOIN users u ON al.user_id = u.id
      WHERE b.id = $1
      ORDER BY al.created_at DESC 
      LIMIT 1
    `;
    const result = await pool.query(query, [id]);

    return result.rows[0] || null;
  } catch (error) {
    console.error(`❌ Error al obtener la marca de la papelera ${id}:`, error);
    return null;
  }
}

export async function getProductsByBrandId(brandId: number) {
  try {
    const query = `
      SELECT 
        id, 
        name, 
        stock, 
        status, 
        deleted_at
      FROM products 
      WHERE brand_id = $1
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query, [brandId]);
    return rows;
  } catch (error) {
    console.error(
      `❌ Error al obtener productos asociados a la marca ${brandId}:`,
      error,
    );
    return [];
  }
}

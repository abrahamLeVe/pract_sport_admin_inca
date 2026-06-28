import { UserTableItem } from "@/validations/auth";
import pool from "../db";

// Obtener todos los usuarios (La DataTable paginará)
export async function getUsers(): Promise<UserTableItem[]> {
  try {
    const query = `
      SELECT *
      FROM users
      ORDER BY created_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      // Consideramos activo si su estado es 'activo' o 'active'
      is_active: row.status === "activo" || row.status === "active",
    })) as UserTableItem[];
  } catch (error) {
    console.error("❌ Error en getUsers:", error);
    return [];
  }
}

export async function getUserByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, image, email, role, status 
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) return null;
    return result.rows[0] as UserTableItem;
  } catch (error) {
    console.error("❌ Error en getUserByIdAction:", error);
    return null;
  }
}

import pool from "../db";

export interface GetUsersParams {
  query?: string;
  page?: number;
  limit?: number;
}

export interface UserRow {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  created_at: Date;
}

export async function getUsersAction({
  query = "",
  page = 1,
  limit = 5,
}: GetUsersParams) {
  const offset = (page - 1) * limit;
  const searchVal = `%${query}%`;

  try {
    // 1. Obtener los usuarios paginados y filtrados
    const usersQuery = `
      SELECT id, name, email, role, status, created_at 
      FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const usersResult = await pool.query<UserRow>(usersQuery, [
      searchVal,
      limit,
      offset,
    ]);

    // 2. Obtener el conteo total para calcular la paginación exacta
    const countQuery = `
      SELECT COUNT(*) FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
    `;
    const countResult = await pool.query(countQuery, [searchVal]);

    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      users: usersResult.rows,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    console.error("❌ Error en getUsersAction:", error);
    return { users: [], totalPages: 0, currentPage: 1 };
  }
}

export async function getUserByIdAction(id: number) {
  try {
    const query = `
      SELECT id, name, email, role, status 
      FROM users 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) return null;
    return result.rows[0];
  } catch (error) {
    console.error("❌ Error en getUserByIdAction:", error);
    return null;
  }
}

"use server";

import pool from "../db";

export interface GetUsersParams {
  query?: string;
  page?: number;
  limit?: number;
}

export async function getUsersAction({
  query = "",
  page = 1,
  limit = 5,
}: GetUsersParams) {
  const offset = (page - 1) * limit;

  try {
    // 1. Consulta con filtros de búsqueda y paginación
    const usersQuery = `
      SELECT id, name, email, role, status, created_at 
      FROM users
      WHERE name ILIKE $1 OR email ILIKE $1
      ORDER BY id DESC
      LIMIT $2 OFFSET $3
    `;
    const searchVal = `%${query}%`;
    const usersResult = await pool.query(usersQuery, [
      searchVal,
      limit,
      offset,
    ]);

    // 2. Consulta para saber el total de registros filtrados (para la paginación)
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
    console.error("Error al obtener usuarios:", error);
    return { users: [], totalPages: 0, currentPage: 1 };
  }
}

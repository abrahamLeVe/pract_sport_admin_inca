import pool from "../db";

interface GetBannersParams {
  query?: string;
  page?: number;
  limit?: number;
}

export async function getBannersAction({
  query = "",
  page = 1,
  limit = 5,
}: GetBannersParams) {
  try {
    const offset = (page - 1) * limit;

    // 1. Obtener los banners con filtros y paginación
    const bannersQuery = `
      SELECT id, title, subtitle, image_url, type, sort_order, status, start_date, end_date, created_at
      FROM banners
      WHERE title ILIKE $1 OR subtitle ILIKE $1
      ORDER BY sort_order ASC, created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const bannersResult = await pool.query(bannersQuery, [
      `%${query}%`,
      limit,
      offset,
    ]);

    // 2. Contar el total de registros para calcular las páginas totales
    const countQuery = `
      SELECT COUNT(*) FROM banners
      WHERE title ILIKE $1 OR subtitle ILIKE $1
    `;
    const countResult = await pool.query(countQuery, [`%${query}%`]);
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      banners: bannersResult.rows,
      totalPages: totalPages || 1,
    };
  } catch (error) {
    console.error("❌ Error en getBannersAction:", error);
    return { banners: [], totalPages: 1 };
  }
}

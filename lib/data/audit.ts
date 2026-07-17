import pool from "@/lib/db";

export async function logAudit(
  userId: number | string | undefined | null,
  // 🔥 Expandimos las acciones permitidas para soportar todo el ciclo de la papelera
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "SOFT_DELETE"
    | "HARD_DELETE"
    | "BULK_SOFT_DELETE"
    | "BULK_HARD_DELETE"
    | "RESTORE"
    | "BULK_RESTORE",
  tableName: string,
  recordId: string | number,
  oldData: any = null,
  newData: any = null,
) {
  try {
    const query = `
      INSERT INTO audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    // Parseamos a JSON de forma segura
    const safeOldData = oldData ? JSON.stringify(oldData) : null;
    const safeNewData = newData ? JSON.stringify(newData) : null;

    // Aseguramos que si viene como string desde NextAuth, Postgres lo reciba limpiamente
    const safeUserId = userId ? Number(userId) : null;

    await pool.query(query, [
      safeUserId,
      action,
      tableName,
      String(recordId),
      safeOldData,
      safeNewData,
    ]);
  } catch (error) {
    // Tu truco silencioso se queda intacto. Es excelente para entornos de producción.
    console.error("❌ Error guardando registro de auditoría:", error);
  }
}

export async function getAuditLogs(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  const query = `
    SELECT 
      a.*, 
      u.name as admin_name, 
      u.email as admin_email
    FROM audit_logs a
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const countQuery = "SELECT COUNT(*) FROM audit_logs";

  const [logsResult, countResult] = await Promise.all([
    pool.query(query, [limit, offset]),
    pool.query(countQuery),
  ]);

  return {
    logs: logsResult.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

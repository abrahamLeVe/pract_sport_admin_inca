import pool from "@/lib/db";

export async function getDashboardAlerts() {
  // Consulta única para obtener todas las alertas críticas
  const query = `
    SELECT 
      (SELECT COUNT(*) FROM product_variants WHERE stock <= 3) as low_stock_count,
      (SELECT COUNT(*) FROM orders WHERE payment_status = 'pendiente' AND created_at < NOW() - INTERVAL '24 hours') as pending_orders_count,
      (SELECT COUNT(*) FROM orders WHERE payment_status = 'fallido' AND created_at >= NOW() - INTERVAL '24 hours') as failed_payments_count
  `;

  const result = await pool.query(query);
  return result.rows[0];
}

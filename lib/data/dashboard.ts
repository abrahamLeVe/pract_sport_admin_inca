import pool from "@/lib/db";

export async function getDashboardData() {
  try {
    // 1. Obtenemos los KPIs generales
    const kpiQuery = `
      SELECT 
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'pagado') as total_revenue,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(DISTINCT customer_email) FROM orders) as total_customers,
        (SELECT COUNT(*) FROM products) as total_products
    `;
    const kpiResult = await pool.query(kpiQuery);
    const kpis = kpiResult.rows[0];

    // 2. Obtenemos los ingresos por día para el gráfico (pedidos pagados)
    const chartQuery = `
      SELECT 
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
        SUM(total_amount) as ingresos
      FROM orders
      WHERE payment_status = 'pagado'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;
    const chartResult = await pool.query(chartQuery);

    return {
      kpis: {
        revenue: parseFloat(kpis.total_revenue),
        orders: parseInt(kpis.total_orders, 10),
        customers: parseInt(kpis.total_customers, 10),
        products: parseInt(kpis.total_products, 10),
      },
      chartData: chartResult.rows.map((row) => ({
        date: row.date,
        ingresos: parseFloat(row.ingresos),
      })),
    };
  } catch (error) {
    console.error("Error al cargar datos del dashboard:", error);
    return {
      kpis: { revenue: 0, orders: 0, customers: 0, products: 0 },
      chartData: [],
    };
  }
}

import pool from "@/lib/db";

// 1. Tipado estricto para que Next.js no dé errores
export interface DashboardData {
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  chartData: { date: string; ingresos: number }[];
}

// 2. Función inteligente que recibe los "días" a filtrar (por defecto 30)
export async function getDashboardData(
  days: number = 30,
): Promise<DashboardData> {
  try {
    const kpiQuery = `
      SELECT 
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'pagado' AND created_at >= NOW() - INTERVAL '${days} days') as total_revenue,
        (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '${days} days') as total_orders,
        (SELECT COUNT(DISTINCT customer_email) FROM orders WHERE created_at >= NOW() - INTERVAL '${days} days') as total_customers,
        (SELECT COUNT(*) FROM products) as total_products
    `;
    const kpiResult = await pool.query(kpiQuery);
    const kpis = kpiResult.rows[0];

    const chartQuery = `
      SELECT 
        TO_CHAR(DATE(created_at), 'YYYY-MM-DD') as date,
        SUM(total_amount) as ingresos
      FROM orders
      WHERE payment_status = 'pagado' AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) ASC
    `;
    const chartResult = await pool.query(chartQuery);

    return {
      kpis: {
        revenue: parseFloat(kpis.total_revenue || "0"),
        orders: parseInt(kpis.total_orders || "0", 10),
        customers: parseInt(kpis.total_customers || "0", 10),
        products: parseInt(kpis.total_products || "0", 10),
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

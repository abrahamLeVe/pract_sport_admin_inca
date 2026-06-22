import pool from "@/lib/db";

export interface ReportData {
  period: string;
  summary: {
    totalRevenue: number; // Solo dinero real (Pagado)
    totalOrders: number; // Todos los intentos
    paidOrders: number; // Solo pedidos exitosos
    avgTicket: number;
  };
  statusDistribution: { status: string; count: number; total: number }[];
  topProducts: { name: string; sold: number; revenue: number }[];
  topCustomers: { name: string; orders: number; spent: number }[];
  detailedOrders: {
    orderNumber: string;
    customer: string;
    date: string;
    method: string;
    status: string; // 🔥 Nuevo campo
    total: number;
  }[];
}

export async function getAdvancedReportData(days: number): Promise<ReportData> {
  try {
    // 1. Resumen General (Todos los pedidos, pero sumando solo los pagados)
    const summaryQuery = pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN payment_status = 'pagado' THEN total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(id) as total_orders,
        COUNT(CASE WHEN payment_status = 'pagado' THEN 1 END) as paid_orders
      FROM orders 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
    `);

    // 2. Distribución de Estados (Pagados vs Pendientes vs Fallidos)
    const statusDistQuery = pool.query(`
      SELECT 
        UPPER(payment_status) as status, 
        COUNT(id) as count, 
        COALESCE(SUM(total_amount), 0) as total
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY payment_status
      ORDER BY total DESC
    `);

    // 3. Productos Estrella (Solo contamos lo que sí se vendió y pagó)
    const topProductsQuery = pool.query(`
      SELECT 
        oi.product_name as name, 
        SUM(oi.quantity) as sold, 
        SUM(oi.subtotal) as revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'pagado' 
        AND o.created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY oi.product_name
      ORDER BY sold DESC
      LIMIT 5
    `);

    // 4. Mejores Clientes (Solo los que sí pagaron)
    const topCustomersQuery = pool.query(`
      SELECT 
        customer_name as name, 
        COUNT(id) as orders, 
        SUM(total_amount) as spent
      FROM orders
      WHERE payment_status = 'pagado' 
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY customer_name, customer_email
      ORDER BY spent DESC
      LIMIT 5
    `);

    // 5. Detalles de Órdenes (🔥 AQUÍ TRAEMOS TODOS, SIN IMPORTAR EL ESTADO)
    const detailedOrdersQuery = pool.query(`
      SELECT 
        order_number as "orderNumber", 
        customer_name as customer, 
        TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as date, 
        COALESCE(payment_method, 'N/A') as method, 
        payment_status as status,
        total_amount as total
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      ORDER BY created_at DESC
    `);

    const [
      summaryRes,
      statusDistRes,
      topProductsRes,
      topCustomersRes,
      detailedOrdersRes,
    ] = await Promise.all([
      summaryQuery,
      statusDistQuery,
      topProductsQuery,
      topCustomersQuery,
      detailedOrdersQuery,
    ]);

    const summaryData = summaryRes.rows[0];
    const totalRevenue = parseFloat(summaryData.total_revenue);
    const paidOrders = parseInt(summaryData.paid_orders || "0", 10);
    const avgTicket = paidOrders > 0 ? totalRevenue / paidOrders : 0;

    return {
      period: `Últimos ${days} días`,
      summary: {
        totalRevenue,
        totalOrders: parseInt(summaryData.total_orders || "0", 10),
        paidOrders,
        avgTicket,
      },
      statusDistribution: statusDistRes.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count, 10),
        total: parseFloat(r.total),
      })),
      topProducts: topProductsRes.rows.map((r) => ({
        name: r.name,
        sold: parseInt(r.sold, 10),
        revenue: parseFloat(r.revenue),
      })),
      topCustomers: topCustomersRes.rows.map((r) => ({
        name: r.name,
        orders: parseInt(r.orders, 10),
        spent: parseFloat(r.spent),
      })),
      detailedOrders: detailedOrdersRes.rows.map((r) => ({
        orderNumber: r.orderNumber,
        customer: r.customer,
        date: r.date,
        method: r.method,
        status: r.status,
        total: parseFloat(r.total),
      })),
    };
  } catch (error) {
    console.error("Error generando datos del reporte:", error);
    throw new Error("No se pudo generar el reporte analítico.");
  }
}

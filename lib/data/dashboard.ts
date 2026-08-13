import pool from "@/lib/db";
import {
  DashboardData,
  EventsDashboardStats,
  RecentRegistration,
} from "@/validations/dashboard";
import { unstable_cache } from "next/cache";

// 🔥 CORRECCIÓN: Transformada en función regular para inyectar 'days' en el caché
export async function getDashboardData(
  days: number = 30,
): Promise<DashboardData> {
  // Lógica inteligente de agrupación
  const isYearly = days >= 365;
  const dateFormat = isYearly ? "YYYY-MM" : "YYYY-MM-DD";
  const dateTrunc = isYearly
    ? "DATE_TRUNC('month', created_at)"
    : "DATE(created_at)";

  const fetchCachedData = unstable_cache(
    async (): Promise<DashboardData> => {
      try {
        const kpiQuery = `
          SELECT 
            (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'pagado' AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days') as total_revenue,
            (SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days') as total_orders,
            (SELECT COUNT(DISTINCT customer_email) FROM orders WHERE deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days') as total_customers,
            (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) as total_products
        `;
        const kpiResult = await pool.query(kpiQuery);
        const initialKpis = kpiResult.rows[0];

        const chartQuery = `
          SELECT 
            TO_CHAR(${dateTrunc}, '${dateFormat}') as date,
            SUM(total_amount) as ingresos
          FROM orders
          WHERE payment_status = 'pagado' AND deleted_at IS NULL AND created_at >= NOW() - INTERVAL '${days} days'
          GROUP BY ${dateTrunc}
          ORDER BY ${dateTrunc} ASC
        `;
        const chartResult = await pool.query(chartQuery);

        return {
          initialKpis: {
            revenue: parseFloat(initialKpis.total_revenue || "0"),
            orders: parseInt(initialKpis.total_orders || "0", 10),
            customers: parseInt(initialKpis.total_customers || "0", 10),
            products: parseInt(initialKpis.total_products || "0", 10),
          },
          initialChartData: chartResult.rows.map((row) => ({
            date: row.date,
            ingresos: parseFloat(row.ingresos),
          })),
        };
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        return {
          initialKpis: { revenue: 0, orders: 0, customers: 0, products: 0 },
          initialChartData: [],
        };
      }
    },
    // Llave dinámica para que el caché de Next.js obedezca a los botones
    [`dashboard-ecommerce-data-${days}`],
    {
      tags: ["dashboard", "orders", "products"],
      revalidate: 30,
    },
  );

  return fetchCachedData();
}

// 2. Dashboard de Eventos (Se mantiene exactamente igual)
export const getEventsDashboardStats = unstable_cache(
  async (): Promise<EventsDashboardStats> => {
    try {
      const [eventsRes, participantsRes, revenueRes, recentRes] =
        await Promise.all([
          pool.query(
            `SELECT COUNT(*) as total FROM events WHERE status != 'draft' AND deleted_at IS NULL`,
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM event_registrations WHERE registration_status != 'cancelled' AND deleted_at IS NULL`,
          ),
          pool.query(
            `SELECT COALESCE(SUM(payment_amount), 0) as total_revenue FROM event_registrations WHERE payment_status = 'paid' AND deleted_at IS NULL`,
          ),
          pool.query<RecentRegistration>(`
            SELECT 
              er.id, 
              er.created_at::text as created_at,
              er.payment_status, 
              er.registration_status,
              e.title as event_title,
              COALESCE(
                  (er.participant_details::jsonb->>'firstName') || ' ' || (er.participant_details::jsonb->>'lastName'),
                  'Sin nombre'
              ) as participant_name
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
            WHERE er.deleted_at IS NULL AND e.deleted_at IS NULL
            ORDER BY er.created_at DESC
            LIMIT 5
          `),
        ]);

      return {
        activeEvents: parseInt(eventsRes.rows[0].total),
        totalParticipants: parseInt(participantsRes.rows[0].total),
        totalRevenue: parseFloat(revenueRes.rows[0].total_revenue),
        recentRegistrations: recentRes.rows,
      };
    } catch (error) {
      console.error("Error fetching events dashboard stats:", error);
      return {
        activeEvents: 0,
        totalParticipants: 0,
        totalRevenue: 0,
        recentRegistrations: [],
      };
    }
  },
  ["dashboard-events-data"],
  {
    tags: ["dashboard", "events", "registrations"],
    revalidate: 30,
  },
);

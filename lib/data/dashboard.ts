import pool from "@/lib/db";
import {
  DashboardData,
  EventsDashboardStats,
  RecentRegistration,
} from "@/validations/dashboard";
import { unstable_cache } from "next/cache";

export const getDashboardData = unstable_cache(
  async (days: number = 30): Promise<DashboardData> => {
    try {
      const kpiQuery = `
        SELECT 
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'pagado' AND created_at >= NOW() - INTERVAL '${days} days') as total_revenue,
          (SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '${days} days') as total_orders,
          (SELECT COUNT(DISTINCT customer_email) FROM orders WHERE created_at >= NOW() - INTERVAL '${days} days') as total_customers,
          (SELECT COUNT(*) FROM products) as total_products
      `;
      const kpiResult = await pool.query(kpiQuery);
      const initialKpis = kpiResult.rows[0];

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
  ["dashboard-ecommerce-data"], // Clave base de caché
  {
    tags: ["dashboard", "orders", "products"],
    revalidate: 30,
  },
);

// 2. Dashboard de Eventos
export const getEventsDashboardStats = unstable_cache(
  async (): Promise<EventsDashboardStats> => {
    try {
      // 🔥 OPTIMIZACIÓN: Disparamos las 4 consultas al mismo tiempo
      const [eventsRes, participantsRes, revenueRes, recentRes] =
        await Promise.all([
          pool.query(
            `SELECT COUNT(*) as total FROM events WHERE status != 'draft'`,
          ),
          pool.query(
            `SELECT COUNT(*) as total FROM event_registrations WHERE registration_status != 'cancelled'`,
          ),
          pool.query(
            `SELECT COALESCE(SUM(payment_amount), 0) as total_revenue FROM event_registrations WHERE payment_status = 'paid'`,
          ),
          pool.query<RecentRegistration>(`
            SELECT 
              er.id, 
              er.created_at::text as created_at, -- Evita errores de hidratación con Dates
              er.payment_status, 
              er.registration_status,
              e.title as event_title,
              COALESCE(
                  (er.participant_details::jsonb->>'firstName') || ' ' || (er.participant_details::jsonb->>'lastName'),
                  'Sin nombre'
              ) as participant_name
            FROM event_registrations er
            JOIN events e ON er.event_id = e.id
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
  ["dashboard-events-data"], // Clave de caché
  {
    tags: ["dashboard", "events", "registrations"],
    revalidate: 30,
  },
);

export interface DashboardData {
  kpis: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  chartData: { date: string; ingresos: number }[];
}

export interface RecentRegistration {
  id: number;
  created_at: Date;
  payment_status: string;
  registration_status: string;
  event_title: string;
  participant_name: string;
}

export interface EventsDashboardStats {
  activeEvents: number;
  totalParticipants: number;
  totalRevenue: number;
  recentRegistrations: RecentRegistration[];
}

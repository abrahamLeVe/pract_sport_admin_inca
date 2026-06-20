import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { getDashboardData } from "@/lib/data/dashboard";

export const metadata = {
  title: "Dashboard | Admin Inca",
};

export default async function Page() {
  // Obtenemos los datos reales desde PostgreSQL
  const data = await getDashboardData();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Panel Principal</h2>
      </div>

      {/* Pasamos los datos a los componentes */}
      <SectionCards kpis={data.kpis} />
      <ChartAreaInteractive chartData={data.chartData} />
    </div>
  );
}

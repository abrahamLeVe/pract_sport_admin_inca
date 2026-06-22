import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { SectionCards } from "@/components/section-cards";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardFilter } from "./_components/dashboard-filter";
import { ExportReportButton } from "./_components/export-report-button";
import { ExportInventoryButton } from "./_components/export-inventory-button";

export const metadata = {
  title: "Dashboard | Admin Inca",
};

// 🔥 FIX: En Next.js 15, searchParams es una Promesa y debe tiparse así
interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ searchParams }: PageProps) {
  // 🔥 FIX: Usamos await para leer la URL correctamente
  const resolvedParams = await searchParams;

  // Leemos el parámetro 'days' de la URL (si no existe, usamos 30 por defecto)
  const daysParam = resolvedParams?.days;
  const currentDays =
    daysParam && !Array.isArray(daysParam) ? parseInt(daysParam, 10) : 30;

  // Obtenemos los datos desde PostgreSQL filtrados por esos días
  const data = await getDashboardData(currentDays);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Panel Principal</h2>

        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <DashboardFilter currentDays={currentDays} />

          <div className="flex items-center gap-2">
            <ExportReportButton days={currentDays} />
            <ExportInventoryButton />
          </div>
        </div>
      </div>

      {/* Pasamos los datos a los componentes */}
      <SectionCards kpis={data.kpis} />

      <div className="mt-4">
        {data.chartData.length > 0 ? (
          <ChartAreaInteractive chartData={data.chartData} />
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-dashed bg-muted/20">
            <p className="text-muted-foreground">
              No hay datos de ingresos en este rango de fechas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

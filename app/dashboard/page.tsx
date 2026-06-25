import { SectionCards } from "@/app/dashboard/_components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDashboardData,
  getEventsDashboardStats,
} from "@/lib/data/dashboard";
import { Suspense } from "react";
import { DashboardFilter } from "./_components/dashboard-filter";
import { EventsTab } from "./_components/events-tab";
import { DashboardTabSkeleton } from "./_components/events-tab-skeleton";
import { ExportInventoryButton } from "./_components/export-inventory-button";
import { ExportReportButton } from "./_components/export-report-button";

export const metadata = {
  title: "Dashboard | Admin Inca",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// ============================================================================
// 1. ENVOLTORIOS ASÍNCRONOS LOCALES (Evitan la creación de archivos extra)
// ============================================================================

async function StoreWrapper({ currentDays }: { currentDays: number }) {
  const data = await getDashboardData(currentDays);
  return (
    <>
      <SectionCards kpis={data.kpis} />
      <div className="mt-4">
        {data.chartData.length > 0 ? (
          <ChartAreaInteractive chartData={data.chartData} />
        ) : (
          <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-dashed bg-muted/20">
            <p className="text-muted-foreground text-sm">
              No hay datos de ingresos en este rango de fechas.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

async function EventsWrapper() {
  const eventsStats = await getEventsDashboardStats();
  return <EventsTab stats={eventsStats} />;
}

// ============================================================================
// 2. COMPONENTE PRINCIPAL (Carga inmediata sin bloqueos)
// ============================================================================

export default async function Page({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;

  const daysParam = resolvedParams?.days;
  const currentDays =
    daysParam && !Array.isArray(daysParam) ? parseInt(daysParam, 10) : 30;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2 mb-4">
        <h2 className="text-3xl font-bold tracking-tight">Panel Principal</h2>
      </div>

      <Tabs defaultValue="store" className="w-full space-y-4">
        <TabsList>
          <TabsTrigger value="store">Tienda E-commerce</TabsTrigger>
          <TabsTrigger value="events">Competencias y Eventos</TabsTrigger>
        </TabsList>

        {/* PESTAÑA: E-COMMERCE */}
        <TabsContent value="store" className="space-y-4">
          <div className="flex flex-wrap items-center justify-end gap-2 md:gap-4 mb-4">
            <DashboardFilter currentDays={currentDays} />
            <div className="flex items-center gap-2">
              <ExportReportButton days={currentDays} />
              <ExportInventoryButton />
            </div>
          </div>

          <Suspense fallback={<DashboardTabSkeleton />}>
            <StoreWrapper currentDays={currentDays} />
          </Suspense>
        </TabsContent>

        {/* PESTAÑA: COMPETENCIAS Y EVENTOS */}
        <TabsContent value="events" className="space-y-4">
          <Suspense fallback={<DashboardTabSkeleton />}>
            <EventsWrapper />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* 1. Cuadrícula exacta de las SectionCards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            {/* Fila superior: Título y espacio para el Icono */}
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-32" />
              {/* Simula el CardDescription */}
              <Skeleton className="h-4 w-4 rounded-md" />
              {/* Simula el Icono */}
            </CardHeader>

            {/* Fila inferior: Número grande y subtítulo */}
            <CardHeader className="pt-0">
              <Skeleton className="h-7 w-20 mb-2 mt-1" />
              {/* Simula el CardTitle (text-2xl) */}
              <Skeleton className="h-3 w-40" /> {/* Simula el p (text-xs) */}
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* 2. Área del Gráfico o Tabla (ChartAreaInteractive / EventsTab) */}
      <Card className="animate-pulse mt-4">
        <CardHeader className="flex flex-col space-y-2 pb-6">
          <Skeleton className="h-6 w-48" /> {/* Título del gráfico/tabla */}
          <Skeleton className="h-4 w-64" /> {/* Subtítulo del gráfico/tabla */}
        </CardHeader>
        <div className="p-6 pt-0">
          <Skeleton className="h-[250px] w-full rounded-xl" />
          {/* Contenido principal */}
        </div>
      </Card>
    </div>
  );
}

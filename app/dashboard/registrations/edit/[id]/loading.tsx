import { Skeleton } from "@/components/ui/skeleton";

export default function DetailLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Breadcrumb Skeleton */}
      <Skeleton className="h-4 w-40 mb-4" />
      <Skeleton className="h-10 w-64 mb-6" />

      {/* Grid principal: 2 columnas para contenido, 1 para gestión */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (Productos + Cliente) */}
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-64 w-full rounded-3xl" />{" "}
          {/* Card Productos */}
          <Skeleton className="h-48 w-full rounded-3xl" /> {/* Card Cliente */}
          <Skeleton className="h-48 w-full rounded-3xl" /> {/* Card Cliente */}
        </div>

        {/* Columna Derecha (Gestión - Sticky) */}
        <div className="space-y-6">
          <Skeleton className="h-[600px] w-full sticky top-14 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}

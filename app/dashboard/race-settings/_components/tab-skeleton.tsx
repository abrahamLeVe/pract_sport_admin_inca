import { Skeleton } from "@/components/ui/skeleton";

export function TabSkeleton() {
  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm w-full">
      {/* 1. Esqueleto del Encabezado */}
      <div className="flex justify-between items-center">
        {/* Título */}
        <Skeleton className="h-7 w-[200px]" />

        {/* Botón "+ Nuevo Color" (¡Ahora con forma de píldora!) */}
        <Skeleton className="h-10 w-[130px] rounded-full" />
      </div>

      {/* 2. Esqueleto de la DataTable */}
      <div className="mt-4 space-y-4">
        {/* Controles superiores */}
        <div className="flex items-center justify-between">
          {/* Buscador (Forma de píldora) */}
          <Skeleton className="h-10 w-[250px] md:w-[350px] rounded-full" />

          {/* Botón "Columnas Visibles" (Forma de píldora) */}
          <Skeleton className="h-10 w-[150px] rounded-full" />
        </div>

        {/* Tabla Falsa (Usamos porcentajes para alineación perfecta) */}
        <div className="rounded-md border">
          {/* Cabecera */}
          <div className="h-12 bg-muted/20 border-b flex items-center px-4">
            <div className="w-[10%]">
              <Skeleton className="h-4 w-6" />
            </div>
            <div className="w-[70%]">
              <Skeleton className="h-4 w-[80px]" />
            </div>

            <div className="w-[20%] flex justify-end">
              <Skeleton className="h-4 w-[60px]" />
            </div>
          </div>

          {/* 5 Filas simulando los datos */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[65px] border-b flex items-center px-4 hover:bg-muted/10"
            >
              {/* ID */}
              <div className="w-[10%]">
                <Skeleton className="h-4 w-4" />
              </div>

              {/* Nombre del Color */}
              <div className="w-[70%]">
                <Skeleton className="h-4 w-[100px] md:w-[140px]" />
              </div>

              {/* Acciones (Ya no son cajas grandes, simulamos el tamaño de los iconos) */}
              <div className="w-[20%] flex justify-end gap-4 pr-2">
                <Skeleton className="h-4 w-4 rounded-sm opacity-50" />
                <Skeleton className="h-4 w-4 rounded-sm opacity-50" />
              </div>
            </div>
          ))}
        </div>

        {/* Paginación Inferior */}
        <div className="flex items-center justify-between pt-2">
          {/* Texto inferior izquierdo: "0 de N filas..." */}
          <Skeleton className="h-4 w-[150px]" />

          {/* Botones Anterior/Siguiente (Forma de píldora) */}
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-[80px] rounded-full" />
            <Skeleton className="h-9 w-[80px] rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

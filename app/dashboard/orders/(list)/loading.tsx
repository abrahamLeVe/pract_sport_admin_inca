import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingOrdersPage() {
  return (
    <div className="space-y-4 p-2 md:p-4">
      {/* 1. Esqueleto del Encabezado */}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[150px]" />
      </div>

      {/* 2. Esqueleto del Contenedor Principal */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[350px] max-w-full" />
        </CardHeader>

        <CardContent>
          {/* Controles de la tabla */}
          <div className="flex items-center justify-between mb-4">
            {/* Buscador (Forma de píldora) */}
            <Skeleton className="h-9 w-[250px] md:w-[350px] rounded-full" />
            {/* Botón Columnas Visibles (Forma de píldora) */}
            <Skeleton className="h-9 w-[150px] rounded-full hidden sm:block" />
          </div>

          {/* Esqueleto de la Tabla de Pedidos */}
          <div className="rounded-md border">
            {/* Fila de cabecera oscura */}
            <div className="h-12 bg-muted/50 border-b flex items-center px-4">
              <div className="w-[15%]">
                <Skeleton className="h-4 w-[80px]" />
              </div>
              <div className="w-[15%]">
                <Skeleton className="h-4 w-[60px]" />
              </div>
              <div className="w-[25%]">
                <Skeleton className="h-4 w-[100px]" />
              </div>
              <div className="w-[15%]">
                <Skeleton className="h-4 w-[60px]" />
              </div>
              <div className="w-[10%]">
                <Skeleton className="h-4 w-[50px]" />
              </div>
              <div className="w-[10%]">
                <Skeleton className="h-4 w-[60px]" />
              </div>
              <div className="w-[10%] flex justify-end">
                <Skeleton className="h-4 w-[60px]" />
              </div>
            </div>

            {/* 5 Filas simulando datos cargando */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-[65px] flex items-center border-b px-4 hover:bg-muted/10"
              >
                {/* N° Pedido */}
                <div className="w-[15%]">
                  <Skeleton className="h-4 w-[90px]" />
                </div>
                {/* Fecha */}
                <div className="w-[15%]">
                  <Skeleton className="h-4 w-[80px]" />
                </div>
                {/* Cliente (Nombre + Email) */}
                <div className="w-[25%] space-y-2">
                  <Skeleton className="h-4 w-[140px] md:w-[180px]" />
                  <Skeleton className="h-3 w-[100px] md:w-[140px]" />
                </div>
                {/* Total */}
                <div className="w-[15%]">
                  <Skeleton className="h-4 w-[70px]" />
                </div>
                {/* Pago */}
                <div className="w-[10%]">
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
                {/* Estado */}
                <div className="w-[10%]">
                  <Skeleton className="h-6 w-[80px] rounded-full" />
                </div>
                {/* Acciones */}
                <div className="w-[10%] flex justify-end pr-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Paginación Inferior */}
          <div className="flex items-center justify-between pt-4">
            <Skeleton className="h-4 w-[150px]" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-[80px] rounded-md" />
              <Skeleton className="h-9 w-[80px] rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

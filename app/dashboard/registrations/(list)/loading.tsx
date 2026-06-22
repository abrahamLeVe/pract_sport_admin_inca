import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingPage() {
  return (
    <div className="space-y-4 p-2 md:p-4">
      {/* 1. Esqueleto del Encabezado (Título y Botón) */}
      <div className="flex items-center justify-between space-y-2">
        <Skeleton className="h-8 w-[250px]" />
      </div>

      {/* 2. Esqueleto del Contenedor Principal */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-[200px] mb-2" />
          <Skeleton className="h-4 w-[400px] max-w-full" />
        </CardHeader>

        <CardContent>
          {/* 🔥 Controles de la tabla: Buscador y Columnas Visibles */}
          <div className="flex items-center justify-between mb-4">
            {/* Buscador (Forma de píldora) */}
            <Skeleton className="h-9 w-[250px] md:w-[375px] rounded-full" />
            {/* Botón Columnas Visibles (Forma de píldora) */}
            <Skeleton className="h-9 w-[150px] rounded-full hidden sm:block" />
          </div>

          {/* Esqueleto de la Tabla */}
          <div className="rounded-md border">
            {/* Fila de cabecera oscura (Ajustada a h-12 para coincidir con Shadcn) */}
            <div className="h-12 bg-muted/50 border-b" />

            {/* Generamos 5 filas falsas para simular datos cargando */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b p-4"
              >
                <div className="flex items-center gap-4">
                  {/* Cuadro simulando la imagen miniatura */}
                  <Skeleton className="h-12 w-12 md:w-16 rounded-md" />
                  {/* Líneas simulando el título y subtítulo */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px] md:w-[250px]" />
                    <Skeleton className="h-3 w-[100px] md:w-[150px]" />
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-8">
                  {/* Cuadros simulando columnas extra (precio, stock) */}
                  <Skeleton className="h-4 w-[60px] hidden md:block" />

                  {/* Cuadro simulando el badge de estado verde/rojo */}
                  <Skeleton className="h-6 w-[70px] rounded-full hidden sm:block" />

                  {/* Cuadrito simulando los 3 puntitos de acciones (Este sí es cuadrado) */}
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* 🔥 Paginación Inferior */}
          <div className="flex items-center justify-between pt-4">
            {/* Texto de "0 de N filas..." */}
            <Skeleton className="h-4 w-[150px]" />
            <div className="flex space-x-2">
              {/* Botones Anterior/Siguiente */}
              <Skeleton className="h-9 w-[80px] rounded-md" />
              <Skeleton className="h-9 w-[80px] rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

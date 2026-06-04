import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function BannersLoading() {
  const skeletonRows = Array.from({ length: 5 });

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Orden</TableHead>
              <TableHead className="w-24">Miniatura</TableHead>
              <TableHead>Título Informativo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Vencimiento</TableHead>
              <TableHead className="w-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, index) => (
              <TableRow key={index}>
                {/* Orden de Clasificación (Centrado) */}
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </TableCell>

                {/* Previsualización de la Imagen (Simula el recuadro h-10 w-16) */}
                <TableCell>
                  <Skeleton className="h-10 w-16 rounded border" />
                </TableCell>

                {/* Título y Subtítulo (Simula el texto principal y el secundario) */}
                <TableCell className="max-w-[240px]">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </TableCell>

                {/* Categoría (Simula el Badge) */}
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>

                {/* Estado Operativo (Simula el Badge) */}
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>

                {/* Fecha de Expiración (Alineado a la derecha) */}
                <TableCell>
                  <div className="flex justify-end">
                    <Skeleton className="h-4 w-20 rounded" />
                  </div>
                </TableCell>

                {/* Menú de Acciones (Botón centrado h-8 w-8) */}
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Esqueleto del Paginador en la parte inferior */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-8 w-64 rounded-md" />
      </div>
    </>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function EventsLoading() {
  const skeletonRows = Array.from({ length: 5 });

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">N°</TableHead>
              <TableHead>Evento y Ubicación</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Disciplina</TableHead>
              <TableHead className="text-center">Cupos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, index) => (
              <TableRow key={index}>
                {/* N° */}
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </TableCell>

                {/* Evento y Ubicación (Título y Subtítulo) */}
                <TableCell className="max-w-50">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/4 max-w-[200px] rounded" />
                    <Skeleton className="h-3 w-1/2 max-w-[120px] rounded" />
                  </div>
                </TableCell>

                {/* Fecha y Hora */}
                <TableCell>
                  <Skeleton className="h-4 w-32 rounded" />
                </TableCell>

                {/* Disciplina */}
                <TableCell>
                  <Skeleton className="h-4 w-20 rounded" />
                </TableCell>

                {/* Cupos */}
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                </TableCell>

                {/* Estado (Badge) */}
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>

                {/* Acciones (Botón de Dropdown) */}
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

      {/* Paginación Skeleton */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-8 w-64 rounded-md" />
      </div>
    </>
  );
}

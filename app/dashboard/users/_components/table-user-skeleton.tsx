import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersLoading() {
  const skeletonRows = Array.from({ length: 5 });

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Fecha Registro</TableHead>
              <TableHead className="w-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, index) => (
              <TableRow key={index}>
                {/* ID */}
                <TableCell>
                  <Skeleton className="h-4 w-6 rounded" />
                </TableCell>

                {/* Nombre */}
                <TableCell>
                  <Skeleton className="h-4 w-32 rounded" />
                </TableCell>

                {/* Correo Electrónico */}
                <TableCell>
                  <Skeleton className="h-4 w-48 rounded" />
                </TableCell>

                {/* Rol (Simula el tamaño de un Badge de Shadcn) */}
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-full" />
                </TableCell>

                {/* Estado (Simula el tamaño de un Badge) */}
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>

                {/* Fecha Registro */}
                <TableCell className="flex justify-end">
                  <Skeleton className="h-4 w-24 rounded" />
                </TableCell>

                {/* Botón de Acciones (...) */}
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

      <div className="flex items-center justify-end space-x-2 py-4">
        <Skeleton className="h-8 w-64 rounded-md" />
      </div>
    </>
  );
}

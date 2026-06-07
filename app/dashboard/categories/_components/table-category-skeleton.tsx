import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function CategoriesLoading() {
  const skeletonRows = Array.from({ length: 5 });

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">N°</TableHead>
              <TableHead className="w-24">Imagen</TableHead>
              <TableHead>Nombre y Slug</TableHead>
              <TableHead className="hidden md:table-cell">
                Descripción
              </TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-12 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex justify-center">
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </TableCell>

                <TableCell>
                  <Skeleton className="h-10 w-10 rounded border" />
                </TableCell>

                <TableCell className="max-w-50">
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                  </div>
                </TableCell>

                <TableCell className="hidden md:table-cell max-w-60">
                  <Skeleton className="h-4 w-full rounded" />
                </TableCell>

                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>

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

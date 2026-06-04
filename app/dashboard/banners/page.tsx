import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBannersAction } from "@/lib/data/banners";
import { Edit2, ImageIcon, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { PaginationUsers } from "../users/_components/pagination-users"; // Reutilizamos tu paginador limpio
import { SearchBanners } from "./_components/search-banners";
import { Suspense } from "react";
import UsersLoading from "../users/_components/table-user-skeleton";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function BannersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || "";
  const page = Number(params.page) || 1;

  const { banners, totalPages } = await getBannersAction({
    query,
    page,
    limit: 5,
  });

  return (
    <>
      <div className="flex items-center justify-between py-2 gap-2">
        <SearchBanners />
        <Button asChild>
          <Link
            href="/dashboard/banners/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Subir Nuevo Banner
          </Link>
        </Button>
      </div>
      <Suspense key={query + page} fallback={<UsersLoading />}>
        {/* Tabla de Control Administrativo */}
        <div className="rounded-md border">
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
              {banners.length > 0 ? (
                banners.map((banner: any) => (
                  <TableRow key={banner.id}>
                    {/* Orden de Clasificación */}
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      #{banner.sort_order}
                    </TableCell>

                    {/* Previsualización de la Imagen alojada en AWS S3 */}
                    <TableCell>
                      <div className="relative h-10 w-16 overflow-hidden rounded border bg-muted flex items-center justify-center">
                        {banner.image_url ? (
                          // Usamos img nativo para simplificar las firmas de dominios externos en NextConfig
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>

                    {/* Título y Subtítulo */}
                    <TableCell className="max-w-[240px] truncate">
                      <div className="font-medium truncate">{banner.title}</div>
                      {banner.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {banner.subtitle}
                        </div>
                      )}
                    </TableCell>

                    {/* Tipo/Categoría de Banner */}
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {banner.type}
                      </Badge>
                    </TableCell>

                    {/* Estado Operativo */}
                    <TableCell>
                      <Badge
                        variant={
                          banner.status === "activo" ? "default" : "secondary"
                        }
                      >
                        {banner.status}
                      </Badge>
                    </TableCell>

                    {/* Fecha de Expiración Programada */}
                    <TableCell className="text-right text-xs">
                      {banner.end_date ? (
                        <span
                          className={
                            new Date(banner.end_date) < new Date()
                              ? "text-destructive font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {new Date(banner.end_date).toLocaleDateString(
                            "es-PE",
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Permanente
                        </span>
                      )}
                    </TableCell>

                    {/* Menú de Acciones de la Fila */}
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-40 rounded-xl"
                        >
                          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer rounded-lg gap-2"
                          >
                            <Link href={`/dashboard/banners/edit/${banner.id}`}>
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Editar Info</span>
                            </Link>
                          </DropdownMenuItem>

                          {/* El botón de borrado definitivo lo engancharemos aquí luego */}
                          <DropdownMenuItem className="cursor-pointer rounded-lg gap-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Eliminar</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No hay banners o eventos registrados para mostrar en el
                    carrusel.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        <PaginationUsers totalPages={totalPages} />
      </Suspense>
    </>
  );
}

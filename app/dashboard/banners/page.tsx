import {
  deleteBannerAction,
  toggleBannerStatusAction,
} from "@/app/actions/banners";
import { DeleteActionItem } from "@/components/delete-action-item";
import { ImageModal } from "@/components/image-modal";
import { ToggleStatusActionItem } from "@/components/toggle-status-action-item";
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
import { Edit2, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "../../../components/pagination";
import { Search } from "../../../components/search";
import BannersLoading from "./_components/table-banner-skeleton";

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
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración del Carrusel de Banners (Web Cliente)
        </h1>
      </div>
      <div className="flex items-center justify-between py-2 gap-2">
        <Search placeholder="Buscar banners..." />
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
      <Suspense key={query + page} fallback={<BannersLoading />}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">N°</TableHead>
                <TableHead className="w-24">Imagen</TableHead>
                <TableHead>Título Informativo</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead className="w-12 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.length > 0 ? (
                banners.map((banner: any, index: number) => (
                  <TableRow key={banner.id}>
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      #{(page - 1) * 5 + index + 1}
                    </TableCell>

                    <TableCell>
                      <ImageModal
                        imageUrl={banner.image_url}
                        altText={banner.title}
                      />
                    </TableCell>

                    <TableCell className="max-w-60 truncate">
                      <div className="font-medium truncate">{banner.title}</div>
                      {banner.subtitle && (
                        <div className="text-xs text-muted-foreground truncate">
                          {banner.subtitle}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {banner.type}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          banner.status === "activo" ? "default" : "secondary"
                        }
                      >
                        {banner.status}
                      </Badge>
                    </TableCell>

                    <TableCell>
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

                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-md">
                          <span className="sr-only">Abrir menú</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            asChild
                            className="cursor-pointer rounded-lg"
                          >
                            <Link href={`/dashboard/banners/edit/${banner.id}`}>
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Editar Info</span>
                            </Link>
                          </DropdownMenuItem>

                          <ToggleStatusActionItem
                            id={banner.id}
                            itemName={banner.name}
                            itemType="banner"
                            currentStatus={banner.status}
                            action={toggleBannerStatusAction}
                          />

                          <DeleteActionItem
                            id={banner.id}
                            itemName={banner.name}
                            itemType="banner"
                            action={deleteBannerAction}
                          />
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

        <Pagination totalPages={totalPages} />
      </Suspense>
    </div>
  );
}

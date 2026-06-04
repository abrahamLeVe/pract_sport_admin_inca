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
import { Edit2, ImageIcon, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "../../../components/pagination";
import { DeleteBannerButton } from "./_components/delete-banner-button";
import { Search } from "../../../components/search";
import BannersLoading from "./_components/table-banner-skeleton";
import { ToggleBannerStatusButton } from "./_components/toggle-banner-status-button";
import { BannerImageModal } from "./_components/banner-image-modal";

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
                banners.map((banner: any, index: number) => (
                  <TableRow key={banner.id}>
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      #{(page - 1) * 5 + index + 1}
                    </TableCell>

                    <TableCell>
                      <BannerImageModal
                        imageUrl={banner.image_url}
                        altText={banner.title}
                      />
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

                          <ToggleBannerStatusButton
                            bannerId={banner.id}
                            bannerTitle={banner.title}
                            currentStatus={banner.status}
                          />

                          <DeleteBannerButton
                            bannerId={banner.id}
                            bannerTitle={banner.title}
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
    </>
  );
}

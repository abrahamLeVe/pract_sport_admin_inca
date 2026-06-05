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
import { Edit2, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "../../../components/pagination";
import { Search } from "../../../components/search";

import { ImageModal } from "@/components/image-modal";
import { getBrandsAction } from "@/lib/data/brands";
import { DeleteBrandButton } from "./_components/delete-brand-button";
import BrandsLoading from "./_components/table-brand-skeleton";
import { ToggleBrandStatusButton } from "./_components/toggle-brand-status-button";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function BrandsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || "";
  const page = Number(params.page) || 1;

  const { brands, totalPages } = await getBrandsAction({
    query,
    page,
    limit: 5,
  });

  return (
    <>
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de Marcas
        </h1>
      </div>
      <div className="flex items-center justify-between py-2 gap-2">
        <Search placeholder="Buscar por nombre o slug..." />
        <Button asChild>
          <Link
            href="/dashboard/brands/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Marca
          </Link>
        </Button>
      </div>
      <Suspense key={query + page} fallback={<BrandsLoading />}>
        <div className="rounded-md border">
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
              {brands.length > 0 ? (
                brands.map((brand: any, index: number) => (
                  <TableRow key={brand.id}>
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      #{(page - 1) * 5 + index + 1}
                    </TableCell>

                    <TableCell>
                      <ImageModal
                        imageUrl={brand.image_url}
                        altText={brand.name}
                      />
                    </TableCell>

                    {/* Nombre y Slug (URL) */}
                    <TableCell className="max-w-50 truncate">
                      <div className="font-medium truncate">{brand.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        /{brand.slug}
                      </div>
                    </TableCell>

                    <TableCell className="hidden md:table-cell max-w-60 not-visited:truncate text-sm text-muted-foreground">
                      {brand.description || (
                        <span className="italic opacity-50">
                          Sin descripción
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          brand.status === "activo" ? "default" : "secondary"
                        }
                      >
                        {brand.status}
                      </Badge>
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
                            <Link href={`/dashboard/brands/edit/${brand.id}`}>
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Editar Info</span>
                            </Link>
                          </DropdownMenuItem>

                          <ToggleBrandStatusButton
                            brandId={brand.id}
                            brandName={brand.name}
                            currentStatus={brand.status}
                          />

                          <DeleteBrandButton
                            brandId={brand.id}
                            brandName={brand.name}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay marcas registradas en la tienda.
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

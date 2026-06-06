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
import { getCategoriesAction } from "@/lib/data/categories";
import { Edit2, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "../../../components/pagination";
import { Search } from "../../../components/search";

import {
  deleteCategoryAction,
  toggleCategoryStatusAction,
} from "@/app/actions/categories";
import { DeleteActionItem } from "@/components/delete-action-item";
import { ImageModal } from "@/components/image-modal";
import { ToggleStatusActionItem } from "@/components/toggle-status-action-item";
import CategoriesLoading from "./_components/table-category-skeleton";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function CategoriesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || "";
  const page = Number(params.page) || 1;

  const { categories, totalPages } = await getCategoriesAction({
    query,
    page,
    limit: 5,
  });

  return (
    <>
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de Categorías
        </h1>
      </div>
      <div className="flex items-center justify-between py-2 gap-2">
        <Search placeholder="Buscar por nombre o slug..." />
        <Button asChild>
          <Link
            href="/dashboard/categories/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Categoría
          </Link>
        </Button>
      </div>
      <Suspense key={query + page} fallback={<CategoriesLoading />}>
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
              {categories.length > 0 ? (
                categories.map((category: any, index: number) => (
                  <TableRow key={category.id}>
                    <TableCell className="text-center font-semibold text-muted-foreground">
                      #{(page - 1) * 5 + index + 1}
                    </TableCell>

                    <TableCell>
                      <ImageModal
                        imageUrl={category.image_url}
                        altText={category.name}
                      />
                    </TableCell>

                    {/* Nombre y Slug (URL) */}
                    <TableCell className="max-w-50 truncate">
                      <div className="font-medium truncate">
                        {category.name}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        /{category.slug}
                      </div>
                    </TableCell>

                    {/* Descripción (se oculta en móviles para no romper el diseño) */}
                    <TableCell className="hidden md:table-cell max-w-60 truncate text-sm text-muted-foreground">
                      {category.description || (
                        <span className="italic opacity-50">
                          Sin descripción
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          category.status === "activo" ? "default" : "secondary"
                        }
                      >
                        {category.status}
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
                            <Link
                              href={`/dashboard/categories/edit/${category.id}`}
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Editar Info</span>
                            </Link>
                          </DropdownMenuItem>

                          <ToggleStatusActionItem
                            id={category.id}
                            itemName={category.name}
                            itemType="categoría"
                            currentStatus={category.status}
                            action={toggleCategoryStatusAction}
                          />

                          <DeleteActionItem
                            id={category.id}
                            itemName={category.name}
                            itemType="categoría"
                            action={deleteCategoryAction}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay categorías registradas en la tienda.
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

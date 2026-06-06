import {
  deleteProductAction,
  toggleProductStatusAction,
} from "@/app/actions/products";
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
import { getProductsAction } from "@/lib/data/products";
import { Edit2, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "../../../components/pagination";
import { Search } from "../../../components/search";
import ProductsLoading from "./_components/table-product-skeleton";

interface PageProps {
  searchParams: Promise<{ query?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || "";
  const page = Number(params.page) || 1;

  const { products, totalPages } = await getProductsAction({
    query,
    page,
    limit: 10,
  });

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de Productos
        </h1>
      </div>
      <div className="flex items-center justify-between py-2 gap-2">
        <Search placeholder="Buscar por nombre o slug..." />
        <Button asChild>
          <Link
            href="/dashboard/products/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Crear Producto
          </Link>
        </Button>
      </div>

      <Suspense key={query + page} fallback={<ProductsLoading />}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">N°</TableHead>
                <TableHead className="w-24">Imagen</TableHead>
                <TableHead>Nombre y Slug</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product: any, index: number) => {
                  const images =
                    typeof product.images === "string"
                      ? JSON.parse(product.images)
                      : product.images;
                  const primaryImage = images[0]?.url || null;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="text-center">
                        #{(page - 1) * 10 + index + 1}
                      </TableCell>
                      <TableCell>
                        <ImageModal
                          imageUrl={primaryImage}
                          altText={product.name}
                          thumbnailClassName="h-10 w-10"
                        />
                      </TableCell>
                      <TableCell className="max-w-50 truncate">
                        <div className="font-medium truncate">
                          {product.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          /{product.slug}
                        </div>
                      </TableCell>
                      <TableCell>S/ {product.price}</TableCell>
                      <TableCell>{product.stock} un.</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.status === "activo"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {product.status}
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
                                href={`/dashboard/products/edit/${product.id}`}
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Editar Info</span>
                              </Link>
                            </DropdownMenuItem>

                            <ToggleStatusActionItem
                              id={product.id}
                              itemName={product.name}
                              itemType="producto"
                              currentStatus={product.status}
                              action={toggleProductStatusAction}
                            />

                            <DeleteActionItem
                              id={product.id}
                              itemName={product.name}
                              itemType="producto"
                              action={deleteProductAction}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No hay productos registradas en la tienda.
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

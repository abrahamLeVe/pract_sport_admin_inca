"use client";

import { deleteProductAction } from "@/app/actions/products";
import { DataTable } from "@/components/data-table";
import { DeleteActionItem } from "@/components/delete-action-item";
import { ImageModal } from "@/components/image-modal";
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
import { ProductTableItem } from "@/validations/products";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Image as ImageIcon, MoreHorizontal, Tags } from "lucide-react";
import Link from "next/link";

export const columns: ColumnDef<ProductTableItem>[] = [
  {
    accessorKey: "main_image",
    header: "Producto",
    cell: ({ row }) => {
      const imageUrl = row.original.main_image;
      return imageUrl ? (
        <ImageModal
          imageUrl={imageUrl}
          altText={row.original.name}
          thumbnailClassName="h-12 w-12 bg-white"
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-md border bg-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Detalles",
    cell: ({ row }) => (
      <div className="flex flex-col max-w-[200px]">
        <span className="font-medium truncate" title={row.original.name}>
          {row.original.name}
        </span>
        <span className="text-xs text-muted-foreground">
          {row.original.category_name || "Sin categoría"} •{" "}
          {row.original.brand_name || "Sin marca"}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Precio",
    cell: ({ row }) => {
      const price = row.original.price;
      const discount = row.original.discount_price;

      const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: "PEN",
        }).format(amount);

      return (
        <div className="flex flex-col">
          {discount ? (
            <>
              <span className="font-bold text-green-600">
                {formatCurrency(discount)}
              </span>
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(price)}
              </span>
            </>
          ) : (
            <span className="font-semibold">{formatCurrency(price)}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.original.stock;
      // Badge rojo si hay menos de 5 unidades, gris si es normal
      return (
        <Badge variant={stock <= 5 ? "destructive" : "secondary"}>
          {stock} unds
        </Badge>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={
            isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""
          }
        >
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/products/edit/${product.id}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" /> Editar Producto
              </Link>
            </DropdownMenuItem>
            {/* Opcional: Enlace directo para gestionar tallas/colores de este producto */}
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/products/edit/${product.id}?tab=variants`}
                className="cursor-pointer"
              >
                <Tags className="mr-2 h-4 w-4" /> Gestionar Variantes
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DeleteActionItem
              id={product.id}
              itemName={product.name}
              itemType="producto"
              action={deleteProductAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface ProductsClientProps {
  data: ProductTableItem[];
}

export function ProductsClient({ data }: ProductsClientProps) {
  return (
    <>
      {/* Buscador inteligente apuntando al nombre del producto */}
      <DataTable columns={columns} data={data} searchKey="name" />
    </>
  );
}

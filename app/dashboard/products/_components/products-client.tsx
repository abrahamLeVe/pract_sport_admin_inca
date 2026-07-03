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
import { formatCurrency } from "@/lib/utils";
import { ProductTableItem } from "@/validations/products";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Image as ImageIcon, MoreHorizontal, Tags } from "lucide-react";
import Link from "next/link";
import { useState } from "react"; // 🔥 Asegúrate de importar useState

// 🔥 1. CREAMOS EL COMPONENTE ACTION CELL PARA CONTROLAR EL ESTADO
const ActionCell = ({ product }: { product: ProductTableItem }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex justify-center">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link
              href={`/dashboard/products/edit/${product.id}`}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" /> Editar Producto
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link
              href={`/dashboard/products/edit/${product.id}?tab=variants`}
              className="cursor-pointer"
            >
              <Tags className="mr-2 h-4 w-4" /> Gestionar Variantes
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 🔥 2. PASAMOS LA PROPIEDAD onSuccess AL DELETE */}
          <DeleteActionItem
            id={product.id}
            action={deleteProductAction}
            title="¿Enviar a papelera?"
            description={`¿Seguro que deseas enviar el producto "${product.name}" a la papelera?`}
            size="default"
            showText={true}
            buttonText="Enviar a papelera"
            asMenuItem={true}
            onSuccess={() => setMenuOpen(false)} // ESTA ES LA MAGIA
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

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
      const trackStock = row.original.track_stock;
      const hasVariants = row.original.has_variants;

      if (hasVariants) {
        return (
          <Badge
            variant="outline"
            className="border-blue-500 text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
          >
            Variantes
          </Badge>
        );
      }

      if (trackStock === false) {
        return <Badge variant="outline">♾️ Ilimitado</Badge>;
      }

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
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => <ActionCell product={row.original} />, // 🔥 3. LLAMAMOS AL NUEVO COMPONENTE AQUÍ
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

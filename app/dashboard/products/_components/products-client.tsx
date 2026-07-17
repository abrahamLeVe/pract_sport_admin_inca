"use client";

import { deleteProductAction } from "@/app/actions/products/crud";
import {
  bulkDeleteProductsAction,
  bulkRestoreProductsAction,
  permanentlyDeleteProductAction,
  restoreProductAction,
} from "@/app/actions/products/trash";
import { DataTable } from "@/components/data-table";
import { ImageModal } from "@/components/image-modal";
import { TrashActionItem } from "@/components/trash-action-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox"; // 🔥 IMPORTAMOS EL CHECKBOX
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
import {
  Edit,
  Eye,
  Image as ImageIcon,
  MoreHorizontal,
  RotateCcw,
  Tags,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

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

          <TrashActionItem
            id={product.id}
            action={deleteProductAction}
            title="¿Enviar a papelera?"
            description={`¿Seguro que deseas enviar el producto "${product.name}" a la papelera?`}
            size="default"
            showText={true}
            buttonText="Enviar a papelera"
            asMenuItem={true}
            onSuccess={() => setMenuOpen(false)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const TrashActionCell = ({ product }: { product: ProductTableItem }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex justify-center">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Acciones Papelera</DropdownMenuLabel>

          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link href={`/dashboard/products/trash/${product.id}`}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalles
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={async () => {
              await restoreProductAction(product.id);
              setMenuOpen(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4 text-green-600" /> Restaurar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <TrashActionItem
            id={product.id}
            action={permanentlyDeleteProductAction}
            title="¿Eliminar definitivamente?"
            description={`¿Seguro? Esta acción borrará a "${product.name}" y sus imágenes de S3 para siempre.`}
            buttonText="Borrar permanentemente"
            asMenuItem={true}
            showText={true}
            onSuccess={() => setMenuOpen(false)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const columns: ColumnDef<ProductTableItem>[] = [
  // 🔥 1. NUEVA COLUMNA DE SELECCIÓN (CHECKBOXES)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Seleccionar todos"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Seleccionar fila"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
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
        {/* 🔥 2. AGREGAMOS EL GÉNERO AQUÍ */}
        <span className="text-xs text-muted-foreground">
          {row.original.category_name || "Sin categoría"} •{" "}
          {row.original.brand_name || "Sin marca"} •{" "}
          {row.original.gender_name || "Unisex"}
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
    cell: ({ row }) => <ActionCell product={row.original} />,
  },
];

interface ProductsClientProps {
  data: ProductTableItem[];
  isTrash?: boolean;
}

export function ProductsClient({ data, isTrash = false }: ProductsClientProps) {
  const [isPending, startTransition] = useTransition();
  const columnsWithActions = [...columns];

  const finalColumns = columnsWithActions.map((col) => {
    if (col.id === "actions" && isTrash) {
      return {
        ...col,
        cell: ({ row }: any) => <TrashActionCell product={row.original} />,
      };
    }
    return col;
  });

  // 🔥 LÓGICA DE PAPELERA (Soft Delete Masivo)
  const handleBulkTrash = (ids: number[], clearSelection: () => void) => {
    startTransition(async () => {
      const result = await bulkDeleteProductsAction(ids);
      if (result.success) {
        toast.success(result.message);
        clearSelection(); // Limpia los checkboxes al terminar
      } else {
        toast.error(result.message);
      }
    });
  };

  // 🔥 LÓGICA DE RESTAURAR (Masivo)
  const handleBulkRestore = (ids: number[], clearSelection: () => void) => {
    startTransition(async () => {
      const result = await bulkRestoreProductsAction(ids);
      if (result.success) {
        toast.success(result.message);
        clearSelection();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <DataTable
      columns={finalColumns}
      data={data}
      searchKey="name"
      exportFilename="productos.csv"
      // 🔥 LE INYECTAMOS LAS ACCIONES MASIVAS AL DATATABLE
      renderSelectionActions={(selectedIds, clearSelection) => {
        // Si estamos en la vista de papelera, mostramos "Restaurar"
        if (isTrash) {
          return (
            <Button
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handleBulkRestore(selectedIds, clearSelection)}
              className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-500 dark:border-green-500 dark:hover:bg-green-500/10 hover:text-green-600"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {isPending ? "Procesando..." : `Restaurar ${selectedIds.length}`}
            </Button>
          );
        }

        // Si estamos en la vista normal, mostramos "Enviar a papelera"
        return (
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => handleBulkTrash(selectedIds, clearSelection)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isPending
              ? "Moviendo..."
              : `Enviar ${selectedIds.length} a papelera`}
          </Button>
        );
      }}
    />
  );
}

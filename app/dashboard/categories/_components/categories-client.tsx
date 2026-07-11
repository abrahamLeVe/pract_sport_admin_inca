"use client";

import { deleteCategoryAction } from "@/app/actions/categories/crud";
import {
  permanentlyDeleteCategoryAction,
  restoreCategoryAction,
} from "@/app/actions/categories/trash";
import { DataTable } from "@/components/data-table";
import { ImageModal } from "@/components/image-modal";
import { TrashActionItem } from "@/components/trash-action-item";
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
import { Category } from "@/validations/categories";
import { ColumnDef } from "@tanstack/react-table";
import {
  Edit,
  Eye,
  Image as ImageIcon,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Acción para el Catálogo Normal
const ActionCell = ({ category }: { category: Category }) => {
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
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link
              href={`/dashboard/categories/edit/${category.id}`}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" /> Editar Categoría
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TrashActionItem
            id={category.id}
            action={deleteCategoryAction}
            title="¿Enviar a papelera?"
            description={`¿Seguro que deseas enviar la categoría "${category.name}" a la papelera?`}
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

// Acción para la Papelera
const TrashActionCell = ({ category }: { category: Category }) => {
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
            <Link href={`/dashboard/categories/trash/${category.id}`}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalles
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={async () => {
              await restoreCategoryAction(category.id);
              setMenuOpen(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4 text-green-600" /> Restaurar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TrashActionItem
            id={category.id}
            action={permanentlyDeleteCategoryAction}
            title="¿Eliminar definitivamente?"
            description={`¿Seguro? Esta acción borrará la categoría "${category.name}" y su imagen de S3 permanentemente.`}
            buttonText="Borrar permanentemente"
            size="default"
            showText={true}
            asMenuItem={true}
            onSuccess={() => setMenuOpen(false)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "image_url",
    header: "Imagen",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
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
    header: "Nombre de Categoría",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">
          /{row.original.slug}
        </span>
      </div>
    ),
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
    cell: ({ row }) => <ActionCell category={row.original} />,
  },
];

interface CategoriesClientProps {
  data: Category[];
  isTrash?: boolean;
}

export function CategoriesClient({
  data,
  isTrash = false,
}: CategoriesClientProps) {
  // Reemplazamos la columna de acciones si estamos en modo papelera
  const finalColumns = columns.map((col) => {
    if (col.id === "actions" && isTrash) {
      return {
        ...col,
        cell: ({ row }: any) => <TrashActionCell category={row.original} />,
      };
    }
    return col;
  });

  return <DataTable columns={finalColumns} data={data} searchKey="name" />;
}

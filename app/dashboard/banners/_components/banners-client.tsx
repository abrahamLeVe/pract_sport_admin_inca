"use client";

import { deleteBannerAction } from "@/app/actions/banners";
import { DataTable } from "@/components/data-table";
import { DeleteActionItem } from "@/components/delete-action-item"; // Asumiendo que usarás tu componente de borrado
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
import { Banner } from "@/validations/banners";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Image as ImageIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";

// 1. Definimos las Columnas de la Tabla
export const columns: ColumnDef<Banner>[] = [
  {
    accessorKey: "image_url",
    header: "Imagen",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      return imageUrl ? (
        <ImageModal
          imageUrl={imageUrl}
          altText={row.original.title}
          thumbnailClassName="h-12 w-24"
        />
      ) : (
        <div className="flex h-12 w-24 items-center justify-center rounded-md border bg-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Título del Banner",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.title}</span>
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
    cell: ({ row }) => {
      const banner = row.original;

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
                href={`/dashboard/banners/edit/${banner.id}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" /> Editar Banner
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DeleteActionItem
              id={banner.id}
              itemName={banner.title}
              itemType="banner"
              action={deleteBannerAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// 2. El componente que junta todo
interface BannersClientProps {
  data: Banner[];
}

export function BannersClient({ data }: BannersClientProps) {
  return (
    <>
      {/* Activamos el buscador apuntando a la columna "title" */}
      <DataTable columns={columns} data={data} searchKey="title" />
    </>
  );
}

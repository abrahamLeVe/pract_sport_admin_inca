"use client";

import { deleteBrandAction } from "@/app/actions/brands";
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
import { Brand } from "@/validations/brands";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Image as ImageIcon, MoreHorizontal } from "lucide-react";
import Link from "next/link";

export const columns: ColumnDef<Brand>[] = [
  {
    accessorKey: "image_url",
    header: "Logo",
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
    header: "Nombre de Marca",
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
    cell: ({ row }) => {
      const brand = row.original;

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
                href={`/dashboard/brands/edit/${brand.id}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" /> Editar Marca
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DeleteActionItem
              id={brand.id}
              itemName={brand.name}
              itemType="marca"
              action={deleteBrandAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface BrandsClientProps {
  data: Brand[];
}

export function BrandsClient({ data }: BrandsClientProps) {
  return (
    <>
      <DataTable columns={columns} data={data} searchKey="name" />
    </>
  );
}

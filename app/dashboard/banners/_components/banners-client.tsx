"use client";

import { deleteBannerAction } from "@/app/actions/banners/crud";
import {
  permanentlyDeleteBannerAction,
  restoreBannerAction,
} from "@/app/actions/banners/trash"; // Asegúrate de tener estas acciones
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
import { Banner } from "@/validations/banners";
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

// Acción para Catálogo Normal
const ActionCell = ({ banner }: { banner: Banner }) => {
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
              href={`/dashboard/banners/edit/${banner.id}`}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" /> Editar Banner
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TrashActionItem
            id={banner.id}
            action={deleteBannerAction}
            title="¿Enviar a papelera?"
            description={`¿Seguro que deseas enviar el banner "${banner.title}" a la papelera?`}
            buttonText="Enviar a papelera"
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

// 🔥 Nueva Acción para la Papelera
const TrashActionCell = ({ banner }: { banner: Banner }) => {
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
            <Link href={`/dashboard/banners/trash/${banner.id}`}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalles
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={async () => {
              await restoreBannerAction(banner.id);
              setMenuOpen(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4 text-green-600" /> Restaurar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <TrashActionItem
            id={banner.id}
            action={permanentlyDeleteBannerAction}
            title="¿Eliminar definitivamente?"
            description={`¿Seguro? Esta acción borrará el banner "${banner.title}" y su imagen de S3 permanentemente.`}
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
          className={isActive ? "bg-green-500 text-white" : ""}
        >
          {isActive ? "Activo" : "Inactivo"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => <ActionCell banner={row.original} />,
  },
];

interface BannersClientProps {
  data: Banner[];
  isTrash?: boolean;
}

export function BannersClient({ data, isTrash = false }: BannersClientProps) {
  const columnsWithActions = [...columns];

  // Si estamos en papelera, reemplazamos la celda de acciones
  const finalColumns = columnsWithActions.map((col) => {
    if (col.id === "actions" && isTrash) {
      return {
        ...col,
        cell: ({ row }: any) => <TrashActionCell banner={row.original} />,
      };
    }
    return col;
  });

  return <DataTable columns={finalColumns} data={data} searchKey="title" />;
}

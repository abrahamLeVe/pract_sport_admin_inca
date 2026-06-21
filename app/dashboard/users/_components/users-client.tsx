"use client";

import { toggleUserStatusAction } from "@/app/actions/users";
import { DataTable } from "@/components/data-table";
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
import { UserTableItem } from "@/validations/auth";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreHorizontal, Shield, User } from "lucide-react";
import Link from "next/link";

export const columns: ColumnDef<UserTableItem>[] = [
  {
    accessorKey: "image_url",
    header: "Avatar",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      return imageUrl ? (
        <ImageModal
          imageUrl={imageUrl}
          altText={row.original.name || "Usuario"}
          // 🔥 Aspecto circular para la foto de perfil
          thumbnailClassName="h-10 w-10 rounded-full object-cover border-2 border-muted"
        />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-muted bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    },
  },
  {
    id: "usuario", // 🔥 Le damos un ID específico
    accessorFn: (row) => `${row.name || ""} ${row.email}`, // 🔥 Le enseñamos al buscador a leer el nombre Y el correo juntos
    header: "Usuario",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.name || "Sin nombre"}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.email}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Rol",
    cell: ({ row }) => {
      const role = row.original.role;
      const isAdmin = role === "admin";

      return (
        <Badge
          variant={isAdmin ? "default" : "outline"}
          className={isAdmin ? "bg-blue-600 hover:bg-blue-700" : ""}
        >
          {isAdmin && <Shield className="w-3 h-3 mr-1" />}
          {role.charAt(0).toUpperCase() + role.slice(1)}
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
      const user = row.original;

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
                href={`/dashboard/users/edit/${user.id}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" /> Editar Usuario
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <ToggleStatusActionItem
              id={user.id}
              itemName={user.name || "este usuario"}
              itemType="usuario"
              currentStatus={user.status}
              action={toggleUserStatusAction}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface UsersClientProps {
  data: UserTableItem[];
}

export function UsersClient({ data }: UsersClientProps) {
  return (
    <>
      {/* Buscador inteligente apuntando al nombre o correo */}
      <DataTable columns={columns} data={data} searchKey="usuario" />
    </>
  );
}

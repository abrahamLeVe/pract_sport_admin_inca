"use client";

import { ColumnDef } from "@tanstack/react-table";
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
import { MoreHorizontal, RotateCcw, Trash2 } from "lucide-react";
import { useState } from "react";
import { TrashActionItem } from "@/components/trash-action-item";
import { permanentlyDeleteEventCategoryAction } from "@/app/actions/events/categories";

// ============================================================================
// MENÚ DE ACCIONES PARA LA CATEGORÍA
// ============================================================================
const CategoryActionCell = ({ category }: { category: any }) => {
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
          <DropdownMenuLabel>Acciones de Categoría</DropdownMenuLabel>

          {/* 🔥 Asumiendo que tienes una acción de restaurar */}
          {/* <DropdownMenuItem
            className="cursor-pointer"
            onClick={async () => {
              await restoreEventCategoryAction(category.id, category.event_id);
              setMenuOpen(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4 text-green-600" /> Restaurar
          </DropdownMenuItem>  */}

          <DropdownMenuSeparator />

          {/* PURGAR DEFINITIVAMENTE */}
          <TrashActionItem
            id={category.id}
            action={async (id) =>
              permanentlyDeleteEventCategoryAction(id, category.event_id)
            }
            title="¿Purgar categoría?"
            description={`¿Seguro? Esta acción borrará permanentemente esta categoría del evento.`}
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

// ============================================================================
// DEFINICIÓN DE COLUMNAS
// ============================================================================
export const eventCategoryColumns: ColumnDef<any>[] = [
  {
    accessorKey: "distance_name",
    header: "Distancia",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.distance_name || "N/A"}</span>
    ),
  },
  {
    accessorKey: "gender_name",
    header: "Género",
  },
  {
    accessorKey: "age_category_name",
    header: "Rango de Edad",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span>{row.original.age_category_name || "General"}</span>
        <span className="text-xs text-muted-foreground">
          ({row.original.applied_min_age} - {row.original.applied_max_age} años)
        </span>
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: "Precio / Cupos",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <Badge variant="outline" className="font-mono w-fit">
          S/ {Number(row.original.price).toFixed(2)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {row.original.cupos} cupos
        </span>
      </div>
    ),
  },
  {
    accessorKey: "deleted_at",
    header: "Estado",
    cell: ({ row }) => {
      const isTrashed = row.original.deleted_at !== null;
      return (
        <Badge variant={isTrashed ? "destructive" : "default"}>
          {isTrashed ? "En Papelera" : "Activo"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => <CategoryActionCell category={row.original} />,
  },
];

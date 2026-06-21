"use client";

import {
  deleteVariantAction,
  toggleVariantStatusAction,
} from "@/app/actions/variants";
import { DataTable } from "@/components/data-table";
import { DeleteActionItem } from "@/components/delete-action-item";
import { ToggleStatusActionItem } from "@/components/toggle-status-action-item";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditColorInput, EditSizeInput } from "@/validations/variants";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { EditVariantDialog } from "./edit-variant-dialog";

interface VariantsClientProps {
  data: any[]; // Usamos any[] porque los datos vienen con JOINs (size_name, color_name)
  colors: EditColorInput[];
  sizes: EditSizeInput[];
  productId: number;
  trackStock: boolean;
}

export function VariantsClient({
  data,
  colors,
  sizes,
  productId,
  trackStock,
}: VariantsClientProps) {
  // Definición de las columnas para la DataTable
  const columns: ColumnDef<any>[] = [
    {
      id: "atributos", // 🔥 ID Combinado para que el buscador encuentre todo
      accessorFn: (row) =>
        `${row.sku || ""} ${row.size_name || "General"} ${row.color_name || "Ninguno"}`,
      header: "Talla / Color",
      cell: ({ row }) => {
        const size = row.original.size_name;
        const color = row.original.color_name;
        const hex = row.original.color_hex;

        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {size || (
                <span className="text-muted-foreground italic text-xs">
                  General
                </span>
              )}
            </span>
            {color ? (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {hex && (
                  <div
                    className="w-3 h-3 rounded-full border shadow-sm shrink-0"
                    style={{ backgroundColor: hex }}
                  />
                )}
                <span>{color}</span>
              </div>
            ) : (
              <span className="text-muted-foreground italic text-xs">
                Sin color
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm font-mono">
          {row.original.sku || <span className="italic">N/A</span>}
        </span>
      ),
    },
    {
      accessorKey: "stock",
      header: trackStock ? "Stock" : "Inventario",
      cell: ({ row }) => {
        const variant = row.original;
        if (variant.track_stock !== false) {
          return <span>{variant.stock} un.</span>;
        } else {
          return (
            <span className="text-muted-foreground italic bg-muted/50 px-2 py-1 rounded text-xs font-medium">
              ♾️ Ilimitado
            </span>
          );
        }
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge
            variant={status === "activo" ? "default" : "secondary"}
            className={
              status === "activo"
                ? "bg-green-500 hover:bg-green-600 text-white"
                : ""
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-center">Acciones</div>,
      cell: ({ row }) => {
        const variant = row.original;
        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Abrir menú</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <EditVariantDialog
                  initialData={variant}
                  productId={productId}
                  colors={colors}
                  sizes={sizes}
                  parentTrackStock={trackStock}
                />

                <ToggleStatusActionItem
                  id={variant.id}
                  itemName={`Talla ${variant.size_name || "Única"} - Color ${variant.color_name || "N/A"}`}
                  itemType="variante"
                  currentStatus={variant.status}
                  action={toggleVariantStatusAction}
                />

                <DeleteActionItem
                  id={variant.id}
                  itemName={`Talla ${variant.size_name || "Única"} - Color ${variant.color_name || "N/A"}`}
                  itemType="variante"
                  action={deleteVariantAction}
                  warningText="Se borrará el stock asociado a esta combinación."
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable columns={columns} data={data} searchKey="atributos" />
    </>
  );
}

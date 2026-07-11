"use client";

import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";

export const CategoryProductColumns: ColumnDef<any>[] = [
  {
    accessorKey: "name",
    header: "Producto",
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "deleted_at",
    header: "Estado",
    cell: ({ row }) => {
      const isTrashed = row.original.deleted_at !== null;
      return (
        <Badge variant={isTrashed ? "destructive" : "default"}>
          {isTrashed ? "Papelera" : "Activo"}
        </Badge>
      );
    },
  },
];

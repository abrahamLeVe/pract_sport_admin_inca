"use client";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Order } from "@/validations/orders";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";

// 1. Configuramos los colores de los estados visuales
const statusColors: Record<string, string> = {
  nuevo: "bg-blue-500 hover:bg-blue-600",
  procesando: "bg-yellow-500 hover:bg-yellow-600",
  enviado: "bg-purple-500 hover:bg-purple-600",
  entregado: "bg-green-500 hover:bg-green-600",
  cancelado: "bg-red-500 hover:bg-red-600",
};

const paymentColors: Record<string, string> = {
  pendiente: "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30",
  pagado: "bg-green-500/20 text-green-700 hover:bg-green-500/30",
  fallido: "bg-red-500/20 text-red-700 hover:bg-red-500/30",
  reembolsado: "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30",
};

// 2. Definimos las Columnas de la Tabla
export const columns: ColumnDef<Order>[] = [
  {
    accessorKey: "order_number",
    header: "N° Pedido",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.order_number}</span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-medium">{row.original.customer_name}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.customer_email}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "total_amount",
    header: "Total",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("total_amount"));
      const formatted = new Intl.NumberFormat("es-PE", {
        style: "currency",
        currency: "PEN",
      }).format(amount);
      return <span className="font-semibold">{formatted}</span>;
    },
  },
  {
    accessorKey: "payment_status",
    header: "Pago",
    cell: ({ row }) => {
      const status = row.original.payment_status;
      return (
        <Badge
          variant="outline"
          className={`capitalize ${paymentColors[status]}`}
        >
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "order_status",
    header: "Estado de Envío",
    cell: ({ row }) => {
      const status = row.original.order_status;
      return (
        <Badge className={`capitalize text-white ${statusColors[status]}`}>
          {status}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

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
                href={`/dashboard/orders/edit/${order.id}`}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" /> Ver detalles
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/orders/edit/${order.id}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" /> Actualizar Estado
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// 3. El componente que junta todo
interface OrdersClientProps {
  data: Order[];
}

export function OrdersClient({ data }: OrdersClientProps) {
  return (
    <>
      <DataTable columns={columns} data={data} searchKey="order_number" />
    </>
  );
}

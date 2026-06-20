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
import { EventRegistration } from "@/validations/registrations";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";

// Colores para los estados de inscripción
const registrationColors: Record<string, string> = {
  pending: "bg-yellow-500 hover:bg-yellow-600",
  approved: "bg-green-500 hover:bg-green-600",
  cancelled: "bg-red-500 hover:bg-red-600",
};

// Colores para los estados de pago
const paymentColors: Record<string, string> = {
  unpaid: "bg-red-500/20 text-red-700 hover:bg-red-500/30",
  pending: "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30", // Por si usan transferencias
  paid: "bg-green-500/20 text-green-700 hover:bg-green-500/30",
  failed: "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30",
  refunded: "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30",
};

export const columns: ColumnDef<EventRegistration>[] = [
  {
    id: "atleta",
    // 🔥 LE ENSEÑAMOS AL BUSCADOR CÓMO LEER EL JSON (Busca por Nombre, Apellido o DNI)
    accessorFn: (row) =>
      `${row.participant_details.firstName} ${row.participant_details.lastName} ${row.participant_details.documentNumber}`,
    header: "Atleta",
    cell: ({ row }) => {
      const details = row.original.participant_details;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {details.firstName} {details.lastName}
          </span>
          <span className="text-xs text-muted-foreground">{details.email}</span>
        </div>
      );
    },
  },
  {
    id: "documento",
    header: "Documento",
    cell: ({ row }) => {
      const details = row.original.participant_details;
      return (
        <span className="text-sm">
          {details.documentType}: {details.documentNumber}
        </span>
      );
    },
  },
  {
    id: "evento",
    header: "Evento y Categoría",
    cell: ({ row }) => (
      <div className="flex flex-col max-w-[250px]">
        <span className="font-medium truncate" title={row.original.event_title}>
          {row.original.event_title}
        </span>
        <span
          className="text-xs text-muted-foreground truncate"
          title={row.original.category_name}
        >
          {row.original.category_name}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "bib_number",
    header: "N° Dorsal",
    cell: ({ row }) => {
      const bib = row.original.bib_number;
      return bib ? (
        <Badge variant="secondary" className="font-bold text-sm px-2">
          {bib}
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground italic">
          Sin asignar
        </span>
      );
    },
  },
  {
    accessorKey: "payment_status",
    header: "Pago",
    cell: ({ row }) => {
      const status = row.original.payment_status;
      // Traducciones rápidas
      const statusText =
        {
          unpaid: "No Pagado",
          pending: "Pendiente",
          paid: "Pagado",
          failed: "Fallido",
          refunded: "Reembolsado",
        }[status] || status;

      return (
        <Badge variant="outline" className={paymentColors[status]}>
          {statusText}
        </Badge>
      );
    },
  },
  {
    accessorKey: "registration_status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.original.registration_status;
      const statusText =
        {
          pending: "Pendiente",
          approved: "Aprobado",
          cancelled: "Cancelado",
        }[status] || status;

      return (
        <Badge className={`text-white ${registrationColors[status]}`}>
          {statusText}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const registration = row.original;

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
                href={`/dashboard/registrations/edit/${registration.id}`}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" /> Revisar Inscripción
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={`/dashboard/registrations/edit/${registration.id}`}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" /> Asignar Dorsal
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

interface RegistrationsClientProps {
  data: EventRegistration[];
}

export function RegistrationsClient({ data }: RegistrationsClientProps) {
  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        // Deshabilitamos la búsqueda por ahora porque el nombre está dentro del JSONB
        searchKey="atleta"
      />
    </>
  );
}

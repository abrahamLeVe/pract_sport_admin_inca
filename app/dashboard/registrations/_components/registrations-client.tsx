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
import {
  EventRegistration,
  paymentColors,
  registrationColors,
} from "@/validations/registrations";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, MoreHorizontal } from "lucide-react";
import Link from "next/link";
import { check } from "zod";

export const columns: ColumnDef<EventRegistration>[] = [
  {
    accessorKey: "id",
    header: "Ticket",
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-sm">
        #{row.original.id}
      </span>
    ),
  },
  {
    id: "atleta",
    accessorFn: (row) =>
      `${row.participant_details?.firstName || ""} ${row.participant_details?.lastName || ""} ${row.participant_details?.documentNumber || ""}`,
    header: "Atleta",
    cell: ({ row }) => {
      const details = row.original.participant_details;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {details?.firstName || "Sin nombre"} {details?.lastName || ""}
          </span>
          <span className="text-xs text-muted-foreground">
            {details?.email || ""}
          </span>
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
          {details?.documentType || "Doc"}: {details?.documentNumber || "-"}
        </span>
      );
    },
  },
  {
    id: "evento",
    header: "Evento y Categoría",
    cell: ({ row }) => (
      <div className="flex flex-col max-w-[250px]">
        {" "}
        {/* 🔥 MEJORA 4: Clase Tailwind válida */}
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
    accessorKey: "created_at",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.original.created_at);
      return (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {date.toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      );
    },
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
      const statusText =
        {
          unpaid: "No Pagado",
          pending: "Por Validar",
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
          checked_in: "Kit Entregado",
        }[status] || status;

      return (
        <Badge className={`border-transparent ${registrationColors[status]}`}>
          {statusText}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
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
                <Edit className="mr-2 h-4 w-4" /> Validar y Asignar
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
        // Buscará perfectamente por nombre, apellido o DNI gracias al accessorFn
        searchKey="atleta"
      />
    </>
  );
}

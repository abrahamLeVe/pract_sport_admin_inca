"use client";

import { deleteEventAction } from "@/app/actions/events/crud";
import {
  permanentlyDeleteEventAction,
  restoreEventAction,
} from "@/app/actions/events/trash";

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
import { EventTableItem } from "@/validations/events";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Edit,
  Eye,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  Users, // 🔥 Importamos el icono de usuarios
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// ============================================================================
// 1. MENÚ DE ACCIONES: CATÁLOGO ACTIVO
// ============================================================================
const ActionCell = ({ event }: { event: EventTableItem }) => {
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
          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link
              href={`/dashboard/events/edit/${event.id}`}
              className="cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" /> Editar evento
            </Link>
          </DropdownMenuItem>

          {/* 🔥 NUEVO BOTÓN: REDIRIGE A LA LISTA DE INSCRITOS */}
          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link
              href={`/dashboard/registrations?eventId=${event.id}`}
              className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
            >
              <Users className="mr-2 h-4 w-4" /> Ver participantes
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <TrashActionItem
            id={event.id}
            action={deleteEventAction}
            title="¿Enviar a papelera?"
            description={`¿Seguro que deseas enviar el evento "${event.title}" a la papelera?`}
            size="default"
            showText={true}
            buttonText="Enviar a papelera"
            asMenuItem={true}
            onSuccess={() => setMenuOpen(false)}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

// ============================================================================
// 2. MENÚ DE ACCIONES: PAPELERA (NUEVO)
// ============================================================================
const TrashActionCell = ({ event }: { event: EventTableItem }) => {
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
          <DropdownMenuLabel>Acciones Papelera</DropdownMenuLabel>

          <DropdownMenuItem asChild onClick={() => setMenuOpen(false)}>
            <Link href={`/dashboard/events/trash/${event.id}`}>
              <Eye className="mr-2 h-4 w-4" /> Ver Detalles
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={async () => {
              await restoreEventAction(event.id);
              setMenuOpen(false);
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4 text-green-600" /> Restaurar
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <TrashActionItem
            id={event.id}
            action={permanentlyDeleteEventAction}
            title="¿Eliminar definitivamente?"
            description={`¿Seguro? Esta acción borrará el evento "${event.title}", su galería, categorías e inscripciones permanentemente.`}
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
// 3. DEFINICIÓN DE COLUMNAS
// ============================================================================
export const columns: ColumnDef<EventTableItem>[] = [
  {
    accessorKey: "image_url",
    header: "Afiche",
    cell: ({ row }) => {
      const imageUrl = row.original.image_url;
      return imageUrl ? (
        <ImageModal
          imageUrl={imageUrl}
          altText={row.original.title}
          thumbnailClassName="h-16 w-16"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-md border bg-muted">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
        </div>
      );
    },
  },
  {
    accessorKey: "title",
    header: "Evento",
    cell: ({ row }) => (
      <div className="flex flex-col max-w-[250px]">
        <span className="font-bold truncate" title={row.original.title}>
          {row.original.title}
        </span>
        <span className="text-xs text-muted-foreground truncate">
          /{row.original.slug}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "event_date",
    header: "Fecha y Lugar",
    cell: ({ row }) => {
      const date = new Date(row.original.event_date);
      const formattedDate = new Intl.DateTimeFormat("es-PE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);

      return (
        <div className="flex flex-col space-y-1">
          <div className="flex items-center text-sm font-medium">
            <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
            {formattedDate}
          </div>
          <div className="flex items-center text-xs text-muted-foreground">
            <MapPin className="mr-1 h-3 w-3" />
            {row.original.location_name || "Por definir"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.original.is_active;
      const statusText =
        row.original.status.charAt(0).toUpperCase() +
        row.original.status.slice(1);

      return (
        <Badge
          variant={isActive ? "default" : "secondary"}
          className={
            isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""
          }
        >
          {isActive ? "Publicado" : statusText}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center">Acciones</div>,
    cell: ({ row }) => <ActionCell event={row.original} />,
  },
];

// ============================================================================
// 4. COMPONENTE PRINCIPAL (CLIENTE)
// ============================================================================
interface EventsClientProps {
  data: EventTableItem[];
  isTrash?: boolean; // 🔥 Parámetro opcional para identificar la vista
}

export function EventsClient({ data, isTrash = false }: EventsClientProps) {
  // 🔥 Interceptamos las columnas para reemplazar la celda de acciones si es la papelera
  const finalColumns = columns.map((col) => {
    if (col.id === "actions" && isTrash) {
      return {
        ...col,
        cell: ({ row }: any) => <TrashActionCell event={row.original} />,
      };
    }
    return col;
  });

  return (
    <>
      <DataTable columns={finalColumns} data={data} searchKey="title" />
    </>
  );
}

"use client";

import { deleteEventAction } from "@/app/actions/events/crud";
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
import { EventTableItem } from "@/validations/events";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  Edit,
  Image as ImageIcon,
  MapPin,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const ActionCell = ({ event }: { event: EventTableItem }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        <DropdownMenuItem
          asChild
          onClick={() => setMenuOpen(false)} // Aquí sí funciona porque navegamos a otra vista
        >
          <Link
            href={`/dashboard/events/edit/${event.id}`}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" /> Editar evento
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* 🔥 ELIMINAMOS EL DIV Y PASAMOS EL ON_SUCCESS */}
        <DeleteActionItem
          id={event.id}
          action={deleteEventAction}
          title="¿Enviar a papelera?"
          description={`¿Seguro que deseas enviar la categoría "${event.title}" a la papelera?`}
          size="default"
          showText={true}
          buttonText="Enviar a papelera"
          asMenuItem={true}
          onSuccess={() => setMenuOpen(false)} // 🔥 Se cierra mágicamente en el momento exacto
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
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
      // Capitalizamos la primera letra del estado original (ej: "published" -> "Published")
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
    cell: ({ row }) => <ActionCell event={row.original} />, // 🔥 Usamos el nuevo componente
  },
];

interface EventsClientProps {
  data: EventTableItem[];
}

export function EventsClient({ data }: EventsClientProps) {
  return (
    <>
      <DataTable columns={columns} data={data} searchKey="title" />
    </>
  );
}

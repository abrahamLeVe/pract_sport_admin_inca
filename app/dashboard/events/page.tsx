import {
  deleteEventAction,
  toggleEventStatusAction,
} from "@/app/actions/events";
import { DeleteActionItem } from "@/components/delete-action-item";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getEventsAction } from "@/lib/data/events";
import { Edit2, MoreHorizontal, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { Pagination } from "../../../components/pagination";
import { Search } from "../../../components/search";
import EventsLoading from "./_components/table-event-skeleton";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || "";
  const page = Number(params.page) || 1;

  const { events, totalPages } = await getEventsAction({
    query,
    page,
    limit: 10,
  });

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de Eventos
        </h1>
      </div>
      <div className="flex items-center justify-between py-2 gap-2">
        <Search placeholder="Buscar por título o ubicación..." />
        <Button asChild>
          <Link
            href="/dashboard/events/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Crear Evento
          </Link>
        </Button>
      </div>

      <Suspense key={query + page} fallback={<EventsLoading />}>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">N°</TableHead>
                <TableHead className="w-24">Afiche</TableHead>
                <TableHead>Evento y Ubicación</TableHead>
                <TableHead className="hidden md:table-cell">
                  Fecha y Hora
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  Disciplina
                </TableHead>
                <TableHead className="text-center">Cupos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-12 text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.length > 0 ? (
                events.map((event: any, index: number) => {
                  // Formatear fecha para la vista
                  const formattedDate = new Date(
                    event.event_date,
                  ).toLocaleString("es-PE", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <TableRow key={event.id}>
                      <TableCell className="text-center font-semibold text-muted-foreground">
                        #{(page - 1) * 10 + index + 1}
                      </TableCell>

                      <TableCell>
                        <ImageModal
                          imageUrl={event.image_url}
                          altText={event.title}
                        />
                      </TableCell>

                      <TableCell className="max-w-50 truncate">
                        <div className="font-medium truncate">
                          {event.title}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          📍 {event.location}
                        </div>
                      </TableCell>

                      <TableCell className="hidden md:table-cell whitespace-nowrap text-sm text-muted-foreground">
                        {formattedDate}
                      </TableCell>

                      <TableCell className="hidden lg:table-cell capitalize text-sm">
                        {event.event_type}
                      </TableCell>

                      <TableCell className="text-center">
                        {Number(event.max_participants) > 0 ? (
                          <div className="flex items-center justify-center gap-1 text-sm">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{event.max_participants}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            Sin límite
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            event.status === "published"
                              ? "default"
                              : event.status === "completed"
                                ? "secondary"
                                : event.status === "cancelled"
                                  ? "destructive"
                                  : "outline"
                          }
                        >
                          {event.status === "draft" && "Borrador"}
                          {event.status === "published" && "Publicado"}
                          {event.status === "completed" && "Finalizado"}
                          {event.status === "cancelled" && "Cancelado"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-2 hover:bg-accent rounded-md">
                            <span className="sr-only">Abrir menú</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              asChild
                              className="cursor-pointer rounded-lg"
                            >
                              <Link href={`/dashboard/events/edit/${event.id}`}>
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>Editar Info</span>
                              </Link>
                            </DropdownMenuItem>

                            <ToggleStatusActionItem
                              id={event.id}
                              itemName={event.title}
                              itemType="evento"
                              currentStatus={event.status}
                              action={toggleEventStatusAction}
                            />

                            <DeleteActionItem
                              id={event.id}
                              itemName={event.title}
                              itemType="evento"
                              action={deleteEventAction}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    No hay eventos registrados en el club.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination totalPages={totalPages} />
      </Suspense>
    </div>
  );
}

import { DataTable } from "@/components/data-table";
import { ImageModal } from "@/components/image-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrashedEventDetailAction } from "@/lib/data/events";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  MapPin,
  PlaySquare, // 🔥 Importamos el icono para el video
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { eventCategoryColumns } from "../../_components/event-category-columns";
import { EventTrashActions } from "../../_components/event-trash-actions";
import { RichTextEditor } from "@/components/rich-text-editor";
import MediaManager from "@/components/media-manager";

export default async function TrashedEventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10);

  const event = await getTrashedEventDetailAction(eventId);

  if (!event) redirect("/dashboard/events/trash");

  const formattedDate = new Intl.DateTimeFormat("es-PE", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(event.event_date));

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/events/trash">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <EventTrashActions eventId={event.id} eventTitle={event.title} />
      </div>

      {/* Banner de Auditoría */}
      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-4 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Evento en papelera</p>
          <p>
            Eliminado por: {event.deleted_by_name || "Sistema"} el{" "}
            {new Date(event.deleted_at_audit).toLocaleString("es-PE")}
          </p>
        </div>
      </div>

      {/* Layout Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* INFO DEL EVENTO */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{event.title}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <Badge variant="outline">Slug: {event.slug}</Badge>
                  <Badge
                    variant={
                      event.status === "published" ? "default" : "secondary"
                    }
                  >
                    {event.status?.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{event.location_name}</span>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">
                Descripción
              </p>
              {event.description ? (
                <RichTextEditor
                  value={event.description}
                  disabled={true}
                  readOnly
                />
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No presenta descripción.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PORTADA PRINCIPAL */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Afiche Principal</CardTitle>
          </CardHeader>
          <CardContent>
            {event.image_url ? (
              <ImageModal
                imageUrl={event.image_url}
                altText={event.title}
                thumbnailClassName="aspect-square w-full rounded-md object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md border bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GALERÍA MEDIA */}
      {/* 🔥 GALERÍA MEDIA: REUTILIZAMOS TU COMPONENTE */}
      <Card>
        <CardContent>
          <MediaManager
            modelType="event"
            modelId={event.id}
            initialMedia={event.media_gallery} // Asegúrate de que getTrashedEventDetailAction devuelve esto
          />
        </CardContent>
      </Card>

      {/* CATEGORÍAS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Categorías Configuradas ({event.categories?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {event.categories?.length > 0 ? (
            <DataTable
              columns={eventCategoryColumns}
              data={event.categories}
              searchKey="distance_name"
            />
          ) : (
            <div className="text-center py-6 text-muted-foreground border rounded-md border-dashed">
              No se configuraron categorías para este evento.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

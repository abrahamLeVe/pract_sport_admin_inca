import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getEventByIdAction } from "@/lib/data/events";
import { getAllMasterEventTypesAction } from "@/lib/data/master-data";
import { ListPlus, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BulkAssignBibs } from "../../_components/bulk-assign-bibs";
import { EditEventForm } from "../../_components/edit-event-form";

export const metadata = {
  title: "Editar Evento | Dashboard",
};

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const eventId = Number(resolvedParams.id);

  const [eventData, eventTypes] = await Promise.all([
    getEventByIdAction(eventId),
    getAllMasterEventTypesAction(),
  ]);

  if (!eventData) {
    notFound();
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-4xl mx-auto space-y-6">
      {/* TARJETA DE GESTIÓN Y ACCIONES RÁPIDAS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/30 p-5 rounded-xl border border-primary/20">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            Gestión del Evento
          </h2>
          <p className="text-sm text-muted-foreground">
            Configura categorías, precios y gestiona el día de la carrera.
          </p>
        </div>

        {/* GRUPO DE BOTONES (Check-In, Asignación, Categorías) */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 🔥 Botón Modo Check-In */}
          <Button
            asChild
            variant="outline"
            className="border-green-600 text-green-600  shrink-0"
          >
            <Link href={`/dashboard/events/edit/${eventId}/check-in`}>
              <QrCode className="w-4 h-4 mr-2" />
              Check-In
            </Link>
          </Button>

          {/* 🔥 Botón Asignación Masiva */}
          <BulkAssignBibs eventId={eventId} />

          {/* 🔥 Botón Categorías */}
          <Button asChild className="shrink-0">
            <Link href={`/dashboard/events/edit/${eventId}/categories`}>
              <ListPlus className="w-4 h-4 mr-2" />
              Asignar categorías
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* TU FORMULARIO PRINCIPAL */}
      <EditEventForm initialData={eventData} eventTypes={eventTypes} />
    </div>
  );
}

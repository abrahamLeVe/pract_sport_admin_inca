import { getEventByIdAction } from "@/lib/data/events";
import { getAllMasterEventTypesAction } from "@/lib/data/master-data";
import { notFound } from "next/navigation";
import { EditEventForm } from "../../_components/edit-event-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ListPlus } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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
      {/* TARJETA PARA IR A LAS CATEGORÍAS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-5 rounded-xl border border-primary/20">
        <div>
          <h2 className="text-lg font-semibold text-primary">
            Categorías y Precios
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las distancias, edades, cupos y precios de este evento de
            forma segura.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href={`/dashboard/events/edit/${eventId}/categories`}>
            <ListPlus className="w-4 h-4 mr-2" />
            Gestionar Categorías
          </Link>
        </Button>
      </div>

      <Separator />

      {/* TU FORMULARIO PRINCIPAL */}
      <EditEventForm initialData={eventData} eventTypes={eventTypes} />
    </div>
  );
}

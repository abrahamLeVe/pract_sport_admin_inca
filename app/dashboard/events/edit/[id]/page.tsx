import { getEventByIdAction } from "@/lib/data/events";
import { getEventCategoriesAction } from "@/lib/data/event-categories";
import { notFound } from "next/navigation";
import { EditEventForm } from "../../_components/edit-event-form";
// CORRECCIÓN AQUÍ: Importa el componente de la tabla, no la página
import { EventCategoriesTable } from "../../_components/event-categories-table";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const resolvedParams = await params;
  const eventId = parseInt(resolvedParams.id, 10);

  if (isNaN(eventId)) {
    notFound();
  }

  const [event, categories] = await Promise.all([
    getEventByIdAction(eventId),
    getEventCategoriesAction(eventId),
  ]);

  if (!event) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <EditEventForm initialData={event} />

      {/* CORRECCIÓN AQUÍ: Usa el nombre del componente de tabla */}
      <EventCategoriesTable categories={categories} eventId={eventId} />
    </div>
  );
}

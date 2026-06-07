import { getEventByIdAction } from "@/lib/data/events";
import { notFound } from "next/navigation";
import { EditEventForm } from "../../_components/edit-event-form";

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

  const event = await getEventByIdAction(eventId);

  if (!event) {
    notFound();
  }

  return <EditEventForm initialData={event} />;
}

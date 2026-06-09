import { getEventByIdAction } from "@/lib/data/events";
import { getEventCategoriesAction } from "@/lib/data/event-categories";
import {
  getAllMasterDistancesAction,
  getAllMasterGendersAction,
  getAllMasterAgeCategoriesAction,
} from "@/lib/data/master-data";
import { EventCategoriesTable } from "../../../_components/event-categories-table";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Categorías del Evento | Dashboard",
};

export default async function EventCategoriesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const eventId = Number(resolvedParams.id);

  // Traemos el evento para el título y todas las tablas maestras para los selectores
  const [eventData, categories, distances, genders, ageCategories] =
    await Promise.all([
      getEventByIdAction(eventId),
      getEventCategoriesAction(eventId),
      getAllMasterDistancesAction(),
      getAllMasterGendersAction(),
      getAllMasterAgeCategoriesAction(),
    ]);

  if (!eventData) notFound();

  return (
    <div className="p-4 md:p-6 w-full max-w-5xl mx-auto space-y-6">
      {/* HEADER CON BOTÓN DE REGRESAR */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/events/edit/${eventId}`}>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Categorías: {eventData.title}
          </h1>
          <p className="text-muted-foreground">
            Administra las distancias, edades, cupos y precios.
          </p>
        </div>
      </div>

      {/* LA TABLA INTERACTIVA */}
      <EventCategoriesTable
        eventId={eventId}
        categories={categories}
        distances={distances}
        genders={genders}
        ageCategories={ageCategories}
      />
    </div>
  );
}

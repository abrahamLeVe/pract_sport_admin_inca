import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEvents } from "@/lib/data/events";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { EventsClient } from "../_components/events-client";

export const metadata = {
  title: "Eventos | Admin Inca",
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Competencias y Eventos
        </h1>
        <div className="flex gap-2">
          <Button variant="destructive" asChild>
            <Link href="/dashboard/events/trash">
              <Trash2 className="mr-2 h-4 w-4" /> Papelera
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/events/new">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Evento
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Carreras</CardTitle>
          <CardDescription>
            Administra tus competencias, define fechas, ubicaciones y publica
            las inscripciones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventsClient data={events} />
        </CardContent>
      </Card>
    </div>
  );
}

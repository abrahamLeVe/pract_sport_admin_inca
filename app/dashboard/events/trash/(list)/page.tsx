import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrashedEvents } from "@/lib/data/events";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EventsClient } from "../../_components/events-client";

export const metadata = {
  title: "Eventos | Admin Inca",
};

export default async function ProductsTrashPage() {
  const events = await getTrashedEvents();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Papelera de Eventos</CardTitle>
            <CardDescription>
              Gestiona los artículos eliminados. Restáuralos o elimínalos
              definitivamente.
            </CardDescription>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard/events">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EventsClient data={events} isTrash={true} />
        </CardContent>
      </Card>
    </div>
  );
}

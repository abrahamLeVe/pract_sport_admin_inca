import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRegistrations } from "@/lib/data/registrations";
import { RegistrationsClient } from "../_components/registrations-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { X } from "lucide-react";
import { ExportCsvButton } from "../_components/export-csv-button";
import { BulkAssignBibs } from "../../events/_components/bulk-assign-bibs";

// 🔥 1. IMPORTAMOS TU BOTÓN AQUÍ
// (Si también vas a poner el BulkAssignBibs aquí, impórtalo igual)

export const metadata = {
  title: "Inscripciones | Admin Inca",
};

type PageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function RegistrationsPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const eventIdParam = resolvedParams?.eventId;

  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;

  const registrations = await getRegistrations(eventId);

  return (
    <div className="space-y-4 p-2 md:p-4">
      {/* Ajusté un poco el flex para que en móviles no se amontone */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Atletas Inscritos</h1>

        {/* 🔥 2. AGRUPAMOS LOS BOTONES DE ACCIÓN */}
        <div className="flex flex-wrap items-center gap-2">
          {eventId && (
            <>
              <BulkAssignBibs eventId={eventId} />

              <ExportCsvButton eventId={eventId} />

              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/registrations">
                  <X className="mr-2 h-4 w-4" /> Mostrar todos los eventos
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Participantes</CardTitle>
          <CardDescription>
            {eventId
              ? "Viendo únicamente las inscripciones de este evento específico."
              : "Revisa las inscripciones a tus eventos, verifica los pagos y asigna los números de dorsal (BIB)."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegistrationsClient data={registrations} />
        </CardContent>
      </Card>
    </div>
  );
}

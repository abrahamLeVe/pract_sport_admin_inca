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

export const metadata = {
  title: "Inscripciones | Admin Inca",
};

// Next.js permite leer los parámetros de la URL usando searchParams
type PageProps = {
  searchParams: Promise<{ [key: string]: string | undefined }>;
};

export default async function RegistrationsPage({ searchParams }: PageProps) {
  // 1. Leemos el ?eventId= de la URL
  const resolvedParams = await searchParams;
  const eventIdParam = resolvedParams?.eventId;

  // 2. Lo convertimos a número (si existe)
  const eventId = eventIdParam ? parseInt(eventIdParam, 10) : undefined;

  // 3. Consultamos la BD (filtrada o completa)
  const registrations = await getRegistrations(eventId);

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Atletas Inscritos</h1>

        {/* 🔥 Si hay un filtro activo, mostramos un botón para limpiar la vista */}
        {eventId && (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/registrations">
              <X className="mr-2 h-4 w-4" /> Mostrar todos los eventos
            </Link>
          </Button>
        )}
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

import { getRegistrations } from "@/lib/data/registrations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegistrationsClient } from "./_components/registrations-client";

export const metadata = {
  title: "Inscripciones | Admin Inca",
};

export default async function RegistrationsPage() {
  // Obtenemos los atletas inscritos desde la base de datos
  const registrations = await getRegistrations();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">Atletas Inscritos</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Participantes</CardTitle>
          <CardDescription>
            Revisa las inscripciones a tus eventos, verifica los pagos y asigna
            los números de dorsal (BIB).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pasamos los datos a la tabla cliente */}
          <RegistrationsClient data={registrations} />
        </CardContent>
      </Card>
    </div>
  );
}

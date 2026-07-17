import { requireSuperAdminSession } from "@/lib/auth-guard";
import { getAuditLogs } from "@/lib/data/audit";
import AuditLogsClient from "./_components/audit-logs-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Auditoría | Admin Inca",
};

export default async function AuditLogsPage() {
  // 🔥 BARRERA DE SEGURIDAD: Solo SUPERADMIN puede ver esta pantalla
  await requireSuperAdminSession();

  // Obtenemos los logs más recientes (ej. los últimos 500 para la tabla)
  // Si tu DataTable maneja paginación local, traer un buen lote inicial es ideal.
  const { logs, total } = await getAuditLogs(1, 500);

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Registro de Auditoría
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Cambios</CardTitle>
          <CardDescription>
            Monitorea todas las acciones (Creaciones, Modificaciones y Borrados)
            realizadas en la base de datos. Mostrando los registros más
            recientes de un total de {total}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogsClient initialLogs={logs} total={total} />
        </CardContent>
      </Card>
    </div>
  );
}

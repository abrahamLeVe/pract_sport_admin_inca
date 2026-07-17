"use client";

import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAuditDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react"; // 🔥 Para el icono de ordenamiento

export type AuditLog = {
  id: number;
  created_at: string;
  user_id: number;
  action: string;
  table_name: string;
  record_id: number;
  old_data: any;
  new_data: any;
  admin_name: string;
  admin_email: string;
};

const actionTranslations: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  CREATE: { label: "Creación", variant: "default" },
  UPDATE: { label: "Modificación", variant: "secondary" },
  DELETE: { label: "Eliminación", variant: "destructive" },
  SOFT_DELETE: { label: "Enviado a Papelera", variant: "destructive" },
  HARD_DELETE: { label: "Purga Definitiva", variant: "destructive" },
  BULK_SOFT_DELETE: { label: "A Papelera (Masivo)", variant: "destructive" },
  BULK_HARD_DELETE: {
    label: "Purga Definitiva (Masivo)",
    variant: "destructive",
  },
  RESTORE: { label: "Restauración", variant: "outline" },
  BULK_RESTORE: { label: "Restauración (Masiva)", variant: "outline" },
};

const tableTranslations: Record<string, string> = {
  products: "Productos",
  product_variants: "Variantes",
  orders: "Pedidos",
  event_registrations: "Inscripciones",
  users: "Usuarios",
  club_settings: "Ajustes del Club",
  media: "Archivos Multimedia",
  media_links: "Enlaces Multimedia",
  master_colors: "Maestro: Colores",
  master_sizes: "Maestro: Tallas",
  master_distances: "Maestro: Distancias",
  master_genders: "Maestro: Géneros",
  master_age_categories: "Maestro: Categorías Edad",
  master_event_types: "Maestro: Tipos Evento",
  event_categories: "Categorías de Eventos",
  banners: "Banners Publicitarios",
  event_media: "Multimedia de Eventos",
};

export const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "created_at",
    // 🔥 Permite ordenar haciendo clic en la cabecera
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="-ml-4"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <span className="whitespace-nowrap capitalize">
        {formatAuditDate(row.original.created_at)}
      </span>
    ),
  },
  {
    id: "admin_search",
    // 🔥 Une nombre y correo para que el buscador encuentre cualquiera de los dos
    accessorFn: (row) => `${row.admin_name || ""} ${row.admin_email || ""}`,
    header: "Administrador",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">
          {row.original.admin_name || "Sistema"}
        </div>
        <div className="text-xs text-muted-foreground">
          {row.original.admin_email}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Acción",
    cell: ({ row }) => {
      const rawAction = row.original.action;
      const mapped = actionTranslations[rawAction] || {
        label: rawAction,
        variant: "secondary",
      };
      return <Badge variant={mapped.variant}>{mapped.label}</Badge>;
    },
  },
  {
    id: "table_name",
    accessorFn: (row) => tableTranslations[row.table_name] || row.table_name,
    header: "Tabla / Módulo",
    cell: ({ getValue }) => (
      <span className="font-medium text-sm">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "record_id",
    header: "ID",
    cell: ({ row }) => (
      <span className="font-mono text-xs">#{row.original.record_id}</span>
    ),
  },
  {
    id: "details",
    header: () => <div className="text-right">Detalles</div>,
    cell: ({ row }) => {
      const log = row.original;
      const actionLabel = actionTranslations[log.action]?.label || log.action;
      const tableLabel = tableTranslations[log.table_name] || log.table_name;

      return (
        <div className="flex justify-end">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Inspeccionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {actionLabel} en {tableLabel} #{log.record_id}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Muestra la comparación de datos antes y después de la
                  modificación.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex flex-col gap-2">
                  <Badge variant="destructive" className="w-fit">
                    Datos Anteriores
                  </Badge>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
                    {log.old_data
                      ? JSON.stringify(log.old_data, null, 2)
                      : "N/A (Creación o sin datos anteriores)"}
                  </pre>
                </div>

                <div className="flex flex-col gap-2">
                  <Badge variant="default" className="w-fit">
                    Datos Nuevos
                  </Badge>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border">
                    {log.new_data
                      ? JSON.stringify(log.new_data, null, 2)
                      : "N/A (Borrado destructivo)"}
                  </pre>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

export default function AuditLogsClient({
  initialLogs,
}: {
  initialLogs: AuditLog[];
  total: number;
}) {
  return (
    <DataTable
      columns={columns}
      data={initialLogs}
      searchKey="admin_search" // 🔥 Ahora busca por el administrador
      searchPlaceholder="Buscar administrador..."
      exportFilename="registro-auditoria.csv"
      // 🔥 Inyectamos el filtro por Acción directamente en el DataTable
      renderCustomFilters={(table) => (
        <Select
          onValueChange={(value) => {
            table
              .getColumn("action")
              ?.setFilterValue(value === "ALL" ? "" : value);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todas las acciones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las acciones</SelectItem>
            <SelectItem value="CREATE">Creaciones</SelectItem>
            <SelectItem value="UPDATE">Modificaciones</SelectItem>
            <SelectItem value="SOFT_DELETE">Enviados a Papelera</SelectItem>
            <SelectItem value="RESTORE">Restauraciones</SelectItem>
            <SelectItem value="HARD_DELETE">Purgas Definitivas</SelectItem>
          </SelectContent>
        </Select>
      )}
    />
  );
}

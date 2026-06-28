"use client";

import { getNotificationList, markAsRead } from "@/app/actions/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  Mail,
  Package,
  ShoppingCart,
  Trophy,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import useSWR from "swr";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reference_id: string;
  is_read: boolean;
  created_at: Date;
}

const fetcher = () => getNotificationList();

export function NotificationBell({
  initialAlerts,
}: {
  initialAlerts: Notification[];
}) {
  // 🔥 Extraemos "mutate" de SWR
  const { data: alerts = initialAlerts, mutate } = useSWR(
    "notifications",
    fetcher,
    {
      refreshInterval: 60000,
      fallbackData: initialAlerts,
    },
  );

  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative cursor-pointer">
          <Bell className="size-5 text-muted-foreground" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              {alerts.length}
            </span>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80">
        {alerts.length === 0 ? (
          <DropdownMenuItem className="text-muted-foreground">
            No tienes alertas nuevas
          </DropdownMenuItem>
        ) : (
          alerts.map((alert: Notification) => (
            <DropdownMenuItem
              key={alert.id}
              className="flex items-start gap-3 p-3 cursor-pointer"
              onClick={async () => {
                // 🔥 1. ACTUALIZACIÓN OPTIMISTA (Desaparece al instante)
                // Filtramos la alerta clickeada y actualizamos el estado local sin esperar al servidor
                const updatedAlerts = alerts.filter(
                  (a: { id: string }) => a.id !== alert.id,
                );
                mutate(updatedAlerts, false); // "false" evita que SWR haga un re-fetch automático en este instante

                // 2. Marcamos como leída en la BD de fondo (el usuario ya no tiene que esperar esto)
                await markAsRead(alert.id);

                // 3. Calculamos la ruta y redirigimos
                const route = getRouteForType(alert.type, alert.reference_id);
                if (route) {
                  router.push(route);
                }
              }}
            >
              <div className="mt-0.5">{getIconForType(alert.type)}</div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-sm">{alert.title}</span>
                <span className="text-xs text-muted-foreground">
                  {alert.message}
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 1. Añade los nuevos iconos al Switch (Importa Mail, AlertTriangle, Trophy de lucide-react)
function getIconForType(type: string) {
  switch (type) {
    case "LOW_STOCK":
      return <Package className="size-4 text-orange-500" />;
    case "PENDING_ORDER":
      return <ShoppingCart className="size-4 text-blue-500" />;
    case "NEW_REGISTRATION":
      return <UserPlus className="size-4 text-green-500" />;
    case "EVENT_UPDATE":
      return <Calendar className="size-4 text-purple-500" />;
    // 🔥 NUEVOS:
    case "PAYMENT_FAILED":
      return <AlertTriangle className="size-4 text-red-600" />; // Rojo fuerte para alertas de pago
    case "NEW_MESSAGE":
      return <Mail className="size-4 text-teal-500" />; // Teal para mensajes de soporte
    case "RACE_RESULTS":
      return <Trophy className="size-4 text-yellow-500" />; // Amarillo/Dorado para resultados
    default:
      return <AlertCircle className="size-4 text-red-500" />;
  }
}

// 2. Añade las nuevas rutas de redirección
function getRouteForType(type: string, referenceId: string) {
  if (!referenceId) return null;

  switch (type) {
    case "LOW_STOCK":
      return `/dashboard/products/edit/${referenceId}`;
    case "PENDING_ORDER":
      return `/dashboard/orders/${referenceId}`;
    case "NEW_REGISTRATION":
      return `/dashboard/registrations`;
    case "EVENT_UPDATE":
      return `/dashboard/events/edit/${referenceId}`;
    // 🔥 NUEVOS:
    case "PAYMENT_FAILED":
      return `/dashboard/orders/${referenceId}`; // Llevas al pedido para ver por qué falló
    case "NEW_MESSAGE":
      return `/dashboard/support/${referenceId}`; // Asumiendo que tendrás una bandeja de entrada
    case "RACE_RESULTS":
      return `/dashboard/events/${referenceId}/results`; // Llevas a la vista de resultados del evento
    default:
      return null;
  }
}

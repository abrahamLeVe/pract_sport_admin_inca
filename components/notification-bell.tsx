"use client";

import useSWR from "swr";
import { getNotificationList, markAsRead } from "@/app/actions/notifications";
import {
  Bell,
  Package,
  ShoppingCart,
  AlertCircle,
  UserPlus,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation"; // <-- 1. Importamos el router

const fetcher = () => getNotificationList();

export function NotificationBell({ initialAlerts }: { initialAlerts: any[] }) {
  const { data: alerts = initialAlerts } = useSWR("notifications", fetcher, {
    refreshInterval: 5000,
    fallbackData: initialAlerts,
  });

  const router = useRouter(); // <-- 2. Inicializamos el router

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
          alerts.map((alert: any) => (
            <DropdownMenuItem
              key={alert.id}
              className="flex items-start gap-3 p-3 cursor-pointer"
              onClick={async () => {
                // 1. Marcamos como leída en la base de datos
                await markAsRead(alert.id);

                // 2. Calculamos la ruta y redirigimos
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

// 1. Añade los nuevos iconos al Switch
function getIconForType(type: string) {
  switch (type) {
    case "LOW_STOCK":
      return <Package className="size-4 text-orange-500" />;
    case "PENDING_ORDER":
      return <ShoppingCart className="size-4 text-blue-500" />;
    case "NEW_REGISTRATION":
      return <UserPlus className="size-4 text-green-500" />; // Verde para éxito/nuevo
    case "EVENT_UPDATE":
      return <Calendar className="size-4 text-purple-500" />; // Púrpura para eventos
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
      return `/dashboard/registrations`; // Te lleva a la lista de inscritos
    case "EVENT_UPDATE":
      return `/dashboard/events/edit/${referenceId}`; // Te lleva a editar ese evento específico
    default:
      return null;
  }
}

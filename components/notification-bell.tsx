"use client";

import {
  getNotificationsAction,
  markAsRead,
} from "@/app/actions/notifications";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Notification } from "@/lib/data/notifications";
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

const fetcher = () => getNotificationsAction();

export function NotificationBell({
  initialAlerts,
}: {
  initialAlerts: Notification[];
}) {
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
                // 1. Actualización optimista (ya lo haces bien)
                const updatedAlerts = alerts.filter((a) => a.id !== alert.id);
                mutate(updatedAlerts, false);

                // 2. 🔥 EL CAMBIO: Quitamos el 'await' para que la navegación no espere
                markAsRead(alert.id).catch((err) =>
                  console.error("Error al marcar como leído:", err),
                );

                // 3. Navegación inmediata
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
    case "PAYMENT_FAILED":
      return <AlertTriangle className="size-4 text-red-600" />;
    case "NEW_MESSAGE":
      return <Mail className="size-4 text-teal-500" />;
    case "RACE_RESULTS":
      return <Trophy className="size-4 text-yellow-500" />;
    default:
      return <AlertCircle className="size-4 text-red-500" />;
  }
}

function getRouteForType(type: string, referenceId: string) {
  if (!referenceId) return null;
  switch (type) {
    case "LOW_STOCK":
      return `/dashboard/products/edit/${referenceId}`;
    case "PENDING_ORDER":
      return `/dashboard/orders/edit/${referenceId}`;
    case "NEW_REGISTRATION":
      return `/dashboard/registrations/edit/${referenceId}`;
    case "EVENT_UPDATE":
      return `/dashboard/events/edit/${referenceId}`;
    case "PAYMENT_FAILED":
      return `/dashboard/orders/edit/${referenceId}`;
    case "NEW_MESSAGE":
      return `/dashboard/support/${referenceId}`;
    case "RACE_RESULTS":
      return `/dashboard/events/${referenceId}/results`;
    default:
      return null;
  }
}

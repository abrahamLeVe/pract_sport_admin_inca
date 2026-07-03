"use client";

import { fetchDashboardDataAction } from "@/app/actions/dashboard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingCart, Users, Wallet } from "lucide-react";
import useSWR from "swr";

interface SectionCardsProps {
  initialKpis: {
    revenue: number;
    orders: number;
    customers: number;
    products: number;
  };
  days?: number;
}

export function SectionCards({ initialKpis, days = 30 }: SectionCardsProps) {
  // 🔥 AQUÍ ESTÁ LA MAGIA AUTOMÁTICA
  const { data: kpis } = useSWR(
    `dashboard-kpis-${days}`,
    async () => {
      const response = await fetchDashboardDataAction(days);
      return response.initialKpis;
    },
    {
      refreshInterval: 30000, // Actualiza automáticamente cada 30 segundos
      fallbackData: initialKpis, // Usa los datos del servidor para la primera carga rápida
    },
  );

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:grid-cols-2 xl:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {/* Tarjeta 1: Ingresos */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Ingresos Totales
          </CardDescription>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {formatCurrency(kpis.revenue)}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Solo pedidos pagados
          </p>
        </CardHeader>
      </Card>

      {/* Tarjeta 2: Pedidos */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Pedidos Recibidos
          </CardDescription>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {kpis.orders}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Transacciones totales en la tienda
          </p>
        </CardHeader>
      </Card>

      {/* Tarjeta 3: Clientes */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Clientes Únicos
          </CardDescription>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {kpis.customers}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Compradores registrados
          </p>
        </CardHeader>
      </Card>

      {/* Tarjeta 4: Productos */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Catálogo Activo
          </CardDescription>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {kpis.products}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Productos creados
          </p>
        </CardHeader>
      </Card>
    </div>
  );
}

"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, Users, Wallet } from "lucide-react";

interface EventsSectionCardsProps {
  kpis: {
    totalRevenue: number;
    totalParticipants: number;
    activeEvents: number;
  };
}

export function EventsSectionCards({ kpis }: EventsSectionCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:grid-cols-2 xl:grid-cols-3 dark:*:data-[slot=card]:bg-card">
      {/* Ingresos */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Ingresos por Inscripciones
          </CardDescription>
          <Wallet className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {formatCurrency(kpis.totalRevenue)}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Inscripciones pagadas
          </p>
        </CardHeader>
      </Card>

      {/* Participantes */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Atletas Inscritos
          </CardDescription>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {kpis.totalParticipants}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Total de registros
          </p>
        </CardHeader>
      </Card>

      {/* Eventos Activos */}
      <Card className="@container/card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardDescription className="text-sm font-medium">
            Eventos Activos
          </CardDescription>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardHeader className="pt-0">
          <CardTitle className="text-2xl font-bold tabular-nums">
            {kpis.activeEvents}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Eventos en curso</p>
        </CardHeader>
      </Card>
    </div>
  );
}

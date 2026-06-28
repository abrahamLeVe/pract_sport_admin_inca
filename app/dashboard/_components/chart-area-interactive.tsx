"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface ChartAreaInteractiveProps {
  chartData: {
    date: string;
    ingresos: number;
  }[];
}

const chartConfig = {
  ingresos: {
    label: "Ingresos (S/)",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive({ chartData }: ChartAreaInteractiveProps) {
  // Si no hay datos (la base de datos está recién creada), mostramos un mensaje bonito
  if (!chartData || chartData.length === 0) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Historial de Ingresos</CardTitle>
          <CardDescription>
            Aún no hay ventas pagadas registradas.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Historial de Ingresos</CardTitle>
        <CardDescription>
          Ventas concretadas (pedidos pagados) a lo largo del tiempo.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillIngresos" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-ingresos)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-ingresos)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value);
                // Evitamos el desfase de zona horaria al formatear
                date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
                return date.toLocaleDateString("es-PE", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `S/ ${value}`}
              width={60}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    date.setMinutes(
                      date.getMinutes() + date.getTimezoneOffset(),
                    );
                    return date.toLocaleDateString("es-PE", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="ingresos"
              type="monotone"
              fill="url(#fillIngresos)"
              stroke="var(--color-ingresos)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

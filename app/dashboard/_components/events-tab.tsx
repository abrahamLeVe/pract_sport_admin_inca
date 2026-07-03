"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RecentRegistration } from "@/validations/dashboard";
import { paymentColors, registrationColors } from "@/validations/registrations";
import { Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { EventsSectionCards } from "./events-section-cards";

interface EventsTabProps {
  stats: {
    activeEvents: number;
    totalParticipants: number;
    totalRevenue: number;
    recentRegistrations: RecentRegistration[];
  };
}

export function EventsTab({ stats }: EventsTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <EventsSectionCards kpis={stats} />

      <Card>
        <CardHeader>
          <CardTitle>Últimos Inscritos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6">Atleta</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right pr-6">Estados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentRegistrations.map((reg: RecentRegistration) => {
                  const regStatusText: Record<string, string> = {
                    pending: "Pendiente",
                    approved: "Aprobado",
                    cancelled: "Cancelado",
                  };

                  const payStatusText: Record<string, string> = {
                    unpaid: "No Pagado",
                    pending: "Por Validar",
                    paid: "Pagado",
                    failed: "Fallido",
                    refunded: "Reembolsado",
                  };

                  return (
                    <Tooltip key={reg.id}>
                      <TooltipTrigger asChild>
                        <TableRow
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() =>
                            router.push(
                              `/dashboard/registrations/edit/${reg.id}`,
                            )
                          }
                        >
                          <TableCell className="pl-6">
                            <div className="flex flex-col">
                              <span className="font-semibold text-sm">
                                {reg.participant_name || "Sin nombre"}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                ID: {reg.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {reg.event_title}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(reg.created_at).toLocaleDateString(
                                "es-PE",
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <div className="flex flex-col items-end gap-1">
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase border ${registrationColors[reg.registration_status] || "bg-gray-100"}`}
                              >
                                {regStatusText[reg.registration_status] ||
                                  reg.registration_status}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-[10px] uppercase border ${paymentColors[reg.payment_status] || "bg-gray-100"}`}
                              >
                                {payStatusText[reg.payment_status] ||
                                  reg.payment_status}
                              </Badge>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Administrar participante</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </div>
  );
}

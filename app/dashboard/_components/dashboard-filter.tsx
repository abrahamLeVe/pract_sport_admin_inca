"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DashboardFilter({ currentDays }: { currentDays: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Función que actualiza la URL cuando seleccionas otra opción
  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", value);
    // Cambia la ruta (ej: /dashboard?days=7)
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline-block font-medium">
        Analizando:
      </span>
      <Select
        defaultValue={currentDays.toString()}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Seleccionar rango" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Últimos 7 días</SelectItem>
          <SelectItem value="15">Últimos 15 días</SelectItem>
          <SelectItem value="30">Últimos 30 días</SelectItem>
          <SelectItem value="90">Últimos 90 días</SelectItem>
          <SelectItem value="365">Último año</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

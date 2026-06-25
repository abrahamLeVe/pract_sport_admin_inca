"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function DashboardFilter({ currentDays }: { currentDays: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground hidden sm:inline-block font-medium">
        Analizando:
      </span>
      <Select
        name="filter_days"
        defaultValue={currentDays.toString()}
        onValueChange={handleValueChange}
      >
        <SelectTrigger
          id="filter_days_trigger"
          className="w-[160px] bg-background"
        >
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

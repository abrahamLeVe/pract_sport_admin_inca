"use client";

import { useState, useTransition } from "react";
import { Hash, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  bulkAssignBibsAction,
  getNextAvailableBibAction,
} from "@/app/actions/registrations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BulkAssignBibsProps {
  eventId: number;
}

export function BulkAssignBibs({ eventId }: BulkAssignBibsProps) {
  const [open, setOpen] = useState(false);
  const [startNumber, setStartNumber] = useState("100");
  const [isPending, startTransition] = useTransition();

  const [isLoadingMax, setIsLoadingMax] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  // 🔥 Nuevo estado para saber cuántos faltan
  const [pendingCount, setPendingCount] = useState<number | null>(null);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setIsLoadingMax(true);
      const result = await getNextAvailableBibAction(eventId);
      if (result.success) {
        setStartNumber(result.nextBib.toString());
        setHasPrevious(result.hasPrevious);
        setPendingCount(result.pendingCount); // Guardamos la cantidad
      }
      setIsLoadingMax(false);
    }
  };

  const handleAssign = () => {
    const bib = parseInt(startNumber, 10);
    if (isNaN(bib) || bib <= 0) {
      toast.error("Por favor, ingresa un número válido mayor a 0.");
      return;
    }

    startTransition(async () => {
      const result = await bulkAssignBibsAction(eventId, bib);
      if (result.success) {
        toast.success(result.message);
        setOpen(false);
      } else {
        toast.error(result.message);
      }
    });
  };

  // Verificamos si no hay a quién asignarle
  const isAllAssigned = pendingCount === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Hash className="h-4 w-4" />
          Asignación Masiva
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Dorsales</DialogTitle>
          <DialogDescription className="min-h-[40px]">
            {isLoadingMax ? (
              <span className="flex items-center text-muted-foreground mt-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verificando registros...
              </span>
            ) : isAllAssigned ? (
              <span className="flex items-center text-green-600 dark:text-green-500 mt-2 font-medium">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                ¡Todo listo! No hay atletas pendientes de asignación en este
                momento.
              </span>
            ) : hasPrevious ? (
              <span className="block mt-2 text-blue-600 dark:text-blue-400">
                Se asignarán dorsales a <b>{pendingCount}</b> atleta(s)
                pendiente(s). Te sugerimos continuar desde el{" "}
                <b>#{startNumber}</b>.
              </span>
            ) : (
              <span className="block mt-2">
                Hay <b>{pendingCount}</b> atleta(s) listos para recibir dorsal.
                Empezaremos desde el número sugerido.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startNumber" className="text-right font-medium">
              Iniciar en:
            </Label>
            <Input
              id="startNumber"
              name="startNumber"
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(e.target.value)}
              // 🔥 Bloqueamos el input si ya todos tienen dorsal
              disabled={isLoadingMax || isPending || isAllAssigned}
              className="col-span-3 text-lg font-semibold"
              placeholder="Ej. 100"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {isAllAssigned ? "Cerrar" : "Cancelar"}
          </Button>
          {/* 🔥 Ocultamos el botón si no hay a quién asignar */}
          {!isAllAssigned && (
            <Button onClick={handleAssign} disabled={isPending || isLoadingMax}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Asignando...
                </>
              ) : (
                "Confirmar y Asignar"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { Hash, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bulkAssignBibsAction } from "@/app/actions/registrations";

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
  const [startNumber, setStartNumber] = useState("100"); // Por defecto sugerimos empezar en 100
  const [isPending, startTransition] = useTransition();

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
        setOpen(false); // Cerramos el modal si todo salió bien
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <Hash className="h-4 w-4" />
          Asignación Masiva
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Dorsales</DialogTitle>
          <DialogDescription>
            El sistema asignará números correlativos a todos los inscritos con
            estado <b>Pagado</b> y <b>Aprobado</b>, ordenados por orden de
            inscripción.
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
            Cancelar
          </Button>
          <Button onClick={handleAssign} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              "Confirmar y Asignar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

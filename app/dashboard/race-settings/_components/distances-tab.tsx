"use client";

import {
  createMasterDistanceAction,
  deleteMasterDistanceAction,
  updateMasterDistanceAction,
} from "@/app/actions/master-data";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditDistanceInput } from "@/validations/master-data";
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmButton } from "./delete-confirm-button";

export default function DistancesTab({ data }: { data: EditDistanceInput[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditDistanceInput | null>(
    null,
  );

  const handleAction = async (prevState: any, formData: FormData) => {
    if (formData.get("id")) {
      return updateMasterDistanceAction(prevState, formData);
    } else {
      return createMasterDistanceAction(prevState, formData);
    }
  };

  const [state, formAction, isPending] = useActionState(handleAction, {
    success: false,
    message: "",
    data: {},
  });

  useEffect(() => {
    if (!state.message) return;

    if (state.success) {
      toast.success(state.message);
      setIsOpen(false);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const openDialog = (item?: EditDistanceInput) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Distancias de Competencia</h2>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Distancia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Distancia" : "Agregar Nueva Distancia"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ingresa el nombre de la nueva distancia para los eventos.
              </DialogDescription>
            </DialogHeader>
            <form
              key={editingItem ? `edit-${editingItem.id}` : "create"}
              action={formAction}
              className="space-y-4 mt-4"
            >
              {editingItem && (
                <input type="hidden" name="id" value={editingItem.id} />
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la Distancia</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: 21K"
                  required
                  autoComplete="off"
                  defaultValue={editingItem?.name || state.data?.name || ""}
                />
                {state.zodErrors?.name && (
                  <FormError error={state.zodErrors.name} />
                )}
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isPending}>
                  {isPending
                    ? "Guardando..."
                    : editingItem
                      ? "Actualizar"
                      : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No hay distancias registradas.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDialog(item)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <DeleteConfirmButton
                    id={item.id}
                    action={deleteMasterDistanceAction}
                    title="¿Eliminar Distancia?"
                    description={`¿Seguro que deseas eliminar "${item.name}"?`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

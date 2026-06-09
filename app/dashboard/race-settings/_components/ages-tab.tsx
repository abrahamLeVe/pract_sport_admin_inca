"use client";

import {
  createMasterAgeCategoryAction,
  deleteMasterAgeCategoryAction,
  updateMasterAgeCategoryAction,
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
import { AgeCategory } from "@/validations/master-data";
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmButton } from "./delete-confirm-button";

export default function AgesTab({ data }: { data: AgeCategory[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgeCategory | null>(null);

  const handleAction = async (prevState: any, formData: FormData) => {
    if (formData.get("id")) {
      return updateMasterAgeCategoryAction(prevState, formData);
    } else {
      return createMasterAgeCategoryAction(prevState, formData);
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

  const openDialog = (item?: AgeCategory) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          Categorías por Edad (Plantillas)
        </h2>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem
                  ? "Editar Categoría de Edad"
                  : "Agregar Categoría de Edad"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Define los rangos de edad para la nueva categoría.
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
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Master A"
                  required
                  autoComplete="off"
                  defaultValue={editingItem?.name || state.data?.name || ""}
                />
                {state.zodErrors?.name && (
                  <FormError error={state.zodErrors.name} />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="default_min_age">Edad Mínima</Label>
                  <Input
                    id="default_min_age"
                    name="default_min_age"
                    type="number"
                    min="0"
                    placeholder="Ej: 40"
                    required
                    autoComplete="off"
                    defaultValue={
                      editingItem?.default_min_age ||
                      state.data?.default_min_age ||
                      ""
                    }
                  />
                  {state.zodErrors?.default_min_age && (
                    <FormError error={state.zodErrors.default_min_age} />
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default_max_age">Edad Máxima</Label>
                  <Input
                    id="default_max_age"
                    name="default_max_age"
                    type="number"
                    min="0"
                    placeholder="Ej: 49"
                    required
                    autoComplete="off"
                    defaultValue={
                      editingItem?.default_max_age ||
                      state.data?.default_max_age ||
                      ""
                    }
                  />
                  {state.zodErrors?.default_max_age && (
                    <FormError error={state.zodErrors.default_max_age} />
                  )}
                </div>
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
            <TableHead>Nombre</TableHead>
            <TableHead>Rango de Edad (referenciales)</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                No hay categorías registradas.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.default_min_age} - {item.default_max_age} años
                </TableCell>
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
                    action={deleteMasterAgeCategoryAction}
                    title="¿Eliminar Categoría de Edad?"
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

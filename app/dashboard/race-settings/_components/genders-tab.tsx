"use client";

import {
  createMasterGenderAction,
  deleteMasterGenderAction,
  updateMasterGenderAction,
} from "@/app/actions/master-data";
import { DataTable } from "@/components/data-table"; // 🔥 Nueva importación
import { DeleteActionItem } from "@/components/delete-action-item";
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
import { EditGenderInput } from "@/validations/master-data";
import { ColumnDef } from "@tanstack/react-table"; // 🔥 Nueva importación
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export default function GendersTab({ data }: { data: EditGenderInput[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditGenderInput | null>(null);

  const handleAction = async (prevState: any, formData: FormData) => {
    if (formData.get("id")) {
      return updateMasterGenderAction(prevState, formData);
    } else {
      return createMasterGenderAction(prevState, formData);
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

  const openDialog = (item?: EditGenderInput) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  // 🔥 1. Definición de columnas para la DataTable
  // Solo mostramos "Nombre" y "Acciones", igual que en tu tabla original
  const columns: ColumnDef<EditGenderInput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.id}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre del Género",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Acciones</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex justify-end items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => openDialog(item)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <DeleteActionItem
              id={item.id}
              action={deleteMasterGenderAction}
              title="¿Eliminar Género?"
              description={`¿Seguro que deseas eliminar "${item.name}" de forma permanente?`}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Géneros de Competencia</h2>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Género
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Género" : "Agregar Nuevo Género"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ingresa el nombre del género de competencia.
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
                <Label htmlFor="name">Nombre del Género</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Femenino"
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

      {/* 🔥 2. Reemplazo de la tabla plana por la DataTable */}
      <div className="mt-4">
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </div>
  );
}

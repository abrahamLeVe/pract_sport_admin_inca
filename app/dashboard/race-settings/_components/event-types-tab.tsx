"use client";

import {
  createMasterEventTypeAction,
  deleteMasterEventTypeAction,
  updateMasterEventTypeAction,
} from "@/app/actions/master-data";
import { DataTable } from "@/components/data-table";
import { FormError } from "@/components/form-error";
import { TrashActionItem } from "@/components/trash-action-item";
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
import { EditEventTypeInput } from "@/validations/master-data";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export default function EventTypesTab({
  data,
}: {
  data: EditEventTypeInput[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditEventTypeInput | null>(
    null,
  );

  const handleAction = async (prevState: any, formData: FormData) => {
    if (formData.get("id")) {
      return updateMasterEventTypeAction(prevState, formData);
    } else {
      return createMasterEventTypeAction(prevState, formData);
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
      setEditingItem(null);
    } else {
      toast.error(state.message);
    }
  }, [state]);

  const openDialog = (item?: EditEventTypeInput) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  // 🔥 1. Definición de columnas para la DataTable (Añadido el ID)
  const columns: ColumnDef<EditEventTypeInput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.id}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre",
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
            <TrashActionItem
              id={item.id}
              action={deleteMasterEventTypeAction}
              title="¿Eliminar Tipo de Evento?"
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
        <h2 className="text-xl font-semibold">Tipo de Evento</h2>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Tipo de Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem
                  ? "Editar Tipo de Evento"
                  : "Agregar Nuevo Tipo de Evento"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ingresa el nombre del tipo de evento.
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
                <Label htmlFor="name">Nombre del Tipo de Evento</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Maratón"
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

      {/* 🔥 2. Reemplazo por la DataTable */}
      <div className="mt-4">
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </div>
  );
}

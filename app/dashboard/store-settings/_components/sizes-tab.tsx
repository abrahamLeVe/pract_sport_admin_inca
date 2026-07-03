"use client";

import {
  createMasterSizeAction,
  deleteMasterSizeAction,
  updateMasterSizeAction,
} from "@/app/actions/store-masters";
import { DataTable } from "@/components/data-table";
import { DeleteActionItem } from "@/components/delete-action-item";
import { FormError } from "@/components/form-error";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditSizeInput } from "@/validations/variants";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export default function SizesTab({ data }: { data: EditSizeInput[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditSizeInput | null>(null);

  const handleAction = async (prevState: any, formData: FormData) => {
    // Si Shadcn envía "General", lo convertimos a un string vacío para que la BD lo guarde como NULL
    if (formData.get("category") === "General") {
      formData.set("category", "");
    }

    if (formData.get("id")) {
      return updateMasterSizeAction(prevState, formData);
    } else {
      return createMasterSizeAction(prevState, formData);
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

  const openDialog = (item?: EditSizeInput) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  // 🔥 1. Definimos las columnas de la DataTable aquí dentro
  const columns: ColumnDef<EditSizeInput>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.id}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Nombre / Medida",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "category",
      header: "Categoría",
      cell: ({ row }) => {
        const category = row.original.category;
        return category ? (
          <Badge variant="outline">{category}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm italic">General</span>
        );
      },
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
              action={deleteMasterSizeAction}
              title="¿Eliminar Talla?"
              description={`¿Seguro que deseas eliminar la talla "${item.name}" de forma permanente?`}
            />
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Tallas y Medidas</h2>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nueva Talla
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Talla" : "Agregar Nueva Talla"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ingresa el nombre y la categoría de la talla.
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
                <Label htmlFor="name">Nombre / Medida</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: M, 42, 1 Kg..."
                  required
                  autoComplete="off"
                  defaultValue={editingItem?.name || state.data?.name || ""}
                />
                {state.zodErrors?.name && (
                  <FormError error={state.zodErrors.name} />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría (Opcional)</Label>
                <Select
                  name="category"
                  defaultValue={
                    editingItem?.category || state.data?.category || "General"
                  }
                >
                  <SelectTrigger className="w-full" id="category">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General / Ninguno</SelectItem>
                    <SelectItem value="Ropa">Ropa</SelectItem>
                    <SelectItem value="Calzado">Calzado</SelectItem>
                    <SelectItem value="Accesorios">Accesorios</SelectItem>
                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                  </SelectContent>
                </Select>
                {state.zodErrors?.category && (
                  <FormError error={state.zodErrors.category} />
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

      {/* 🔥 2. Reemplazamos la tabla plana por la DataTable mágica */}
      <div className="mt-4">
        <DataTable columns={columns} data={data} searchKey="name" />
      </div>
    </div>
  );
}

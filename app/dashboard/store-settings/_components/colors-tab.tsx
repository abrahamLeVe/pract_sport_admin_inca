"use client";

import {
  createMasterColorAction,
  deleteMasterColorAction,
  updateMasterColorAction,
} from "@/app/actions/store-masters";
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
import { EditColorInput } from "@/validations/variants";
import { Pencil, Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { DeleteConfirmButton } from "./delete-confirm-button";

export default function ColorsTab({ data }: { data: EditColorInput[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EditColorInput | null>(null);

  const handleAction = async (prevState: any, formData: FormData) => {
    if (formData.get("id")) {
      return updateMasterColorAction(prevState, formData);
    } else {
      return createMasterColorAction(prevState, formData);
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

  const openDialog = (item?: EditColorInput) => {
    setEditingItem(item || null);
    setIsOpen(true);
  };

  return (
    <div className="space-y-4 bg-card p-6 rounded-lg border shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Colores de Productos</h2>

        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setEditingItem(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="w-4 h-4 mr-2" /> Nuevo Color
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Color" : "Agregar Nuevo Color"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Ingresa el nombre y el código hexadecimal del nuevo color.
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

              {/* CAMPO: NOMBRE DEL COLOR */}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Color</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej: Azul Marino"
                  required
                  autoComplete="off"
                  defaultValue={editingItem?.name || state.data?.name || ""}
                />
                {state.zodErrors?.name && (
                  <FormError error={state.zodErrors.name} />
                )}
              </div>

              {/* CAMPO: CÓDIGO HEXADECIMAL CON SELECTOR VISUAL */}
              <div className="space-y-2">
                <Label htmlFor="hex_code">Código Hexadecimal (Opcional)</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer"
                    title="Seleccionar color"
                    defaultValue={
                      editingItem?.hex_code || state.data?.hex_code || "#000000"
                    }
                    onChange={(e) => {
                      // Al mover el selector de color, actualizamos el texto del input contiguo
                      const textInput = document.getElementById(
                        "hex_code",
                      ) as HTMLInputElement;
                      if (textInput)
                        textInput.value = e.target.value.toUpperCase();
                    }}
                  />
                  <Input
                    id="hex_code"
                    name="hex_code"
                    placeholder="Ej: #1E3A8A"
                    autoComplete="off"
                    defaultValue={
                      editingItem?.hex_code || state.data?.hex_code || ""
                    }
                  />
                </div>
                {state.zodErrors?.hex_code && (
                  <FormError error={state.zodErrors.hex_code} />
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
            <TableHead>Muestra (Hex)</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                No hay colores registrados.
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>

                <TableCell>
                  {item.hex_code ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border shadow-sm"
                        style={{ backgroundColor: item.hex_code }}
                      />
                      <span className="text-sm font-mono text-muted-foreground">
                        {item.hex_code}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">
                      Ninguno
                    </span>
                  )}
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
                    action={deleteMasterColorAction}
                    title="¿Eliminar Color?"
                    description={`¿Seguro que deseas eliminar el color "${item.name}"?`}
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

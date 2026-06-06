"use client";

import { createVariantAction } from "@/app/actions/variants";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export function RegisterVariantDialog({ productId }: { productId: number }) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {},
  };

  const [formState, formAction, isPending] = useActionState(
    createVariantAction,
    initialState,
  );

  useEffect(() => {
    if (formState.success) {
      toast.success(formState.message);
      setIsOpen(false);
    } else if (formState.message && !formState.success) {
      toast.error(formState.message);
    }
  }, [formState]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Añadir Variante
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Nueva Variante</DialogTitle>
          <DialogDescription>
            Agrega inventario específico para una combinación de talla o color.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4 mt-4">
          <input type="hidden" name="product_id" value={productId} />

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="size">Talla</FieldLabel>
              <Input
                id="size"
                name="size"
                placeholder="Ej. 40, L, Única"
                defaultValue={formState.data?.size as string}
                disabled={isPending}
                autoComplete="off"
              />
              <FormError error={formState.zodErrors?.size} />
            </Field>

            <Field>
              <FieldLabel htmlFor="color">Color</FieldLabel>
              <Input
                id="color"
                name="color"
                placeholder="Ej. Rojo, Negro"
                defaultValue={formState.data?.color as string}
                disabled={isPending}
                autoComplete="off"
              />
              <FormError error={formState.zodErrors?.color} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="stock">Stock</FieldLabel>
              <Input
                id="stock"
                name="stock"
                type="number"
                placeholder="Ej. 10"
                defaultValue={formState.data?.stock as string}
                disabled={isPending}
                required
              />
              <FormError error={formState.zodErrors?.stock} />
            </Field>

            <Field>
              <FieldLabel htmlFor="sku">SKU (Opcional)</FieldLabel>
              <Input
                id="sku"
                name="sku"
                placeholder="Código único"
                disabled={isPending}
                defaultValue={formState.data?.sku as string}
                autoComplete="off"
              />
              <FormError error={formState.zodErrors?.sku} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="status">Estado</FieldLabel>
            <Select
              name="status"
              defaultValue={formState.data?.status as string}
              disabled={isPending}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>
            <FormError error={formState.zodErrors?.status} />
          </Field>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar Variante"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

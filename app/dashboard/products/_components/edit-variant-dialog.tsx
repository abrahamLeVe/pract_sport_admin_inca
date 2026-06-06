"use client";

import { updateVariantAction } from "@/app/actions/variants";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductVariant } from "@/validations/variants";
import { Edit2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

interface EditVariantDialogProps {
  variant: ProductVariant;
}

export function EditVariantDialog({ variant }: EditVariantDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {},
  };

  const [formState, formAction, isPending] = useActionState(
    updateVariantAction,
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
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          className="cursor-pointer rounded-lg"
        >
          <Edit2 className="h-3.5 w-3.5 text-muted-foreground mr-2" />
          <span>Editar Variante</span>
        </DropdownMenuItem>
      </DialogTrigger>

      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>Editar Variante</DialogTitle>
          <DialogDescription>
            Actualiza el stock, talla o color de esta variante.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="flex flex-col gap-4 mt-4">
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="product_id" value={variant.product_id} />

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="size">Talla</FieldLabel>
              <Input
                id="size"
                name="size"
                placeholder="Ej. 40, L, Única"
                defaultValue={
                  (formState.data?.size as string) ?? variant.size ?? ""
                }
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
                defaultValue={
                  (formState.data?.color as string) ?? variant.color ?? ""
                }
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
                defaultValue={
                  (formState.data?.stock as string) ?? variant.stock ?? "0"
                }
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
                defaultValue={
                  (formState.data?.sku as string) ?? variant.sku ?? ""
                }
                disabled={isPending}
                autoComplete="off"
              />
              <FormError error={formState.zodErrors?.sku} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="status">Estado</FieldLabel>
            <Select
              name="status"
              defaultValue={
                (formState.data?.status as string) ?? variant.status ?? "activo"
              }
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
              {isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { EditVariantFormProps } from "@/validations/variants";
import { Edit2 } from "lucide-react";
import { startTransition, useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

export function EditVariantDialog({
  initialData: variant,
  colors,
  sizes,
  parentTrackStock = true,
}: EditVariantFormProps & { parentTrackStock?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);

  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {},
  };

  const [trackStock, setTrackStock] = useState(
    variant.track_stock !== undefined
      ? variant.track_stock
        ? "true"
        : "false"
      : parentTrackStock
        ? "true"
        : "false",
  );

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

  const handleAction = (formData: FormData) => {
    if (formData.get("size_id") === "none") formData.set("size_id", "");
    if (formData.get("color_id") === "none") formData.set("color_id", "");

    if (trackStock === "false") {
      formData.set("stock", "0");
    }

    formData.set("track_stock", trackStock);

    startTransition(() => formAction(formData));
  };

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
            Actualiza los detalles de esta variante.
          </DialogDescription>
        </DialogHeader>

        <form action={handleAction} className="flex flex-col gap-4 mt-4">
          <input type="hidden" name="id" value={variant.id} />
          <input type="hidden" name="product_id" value={variant.product_id} />

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="size_id">Talla</FieldLabel>
              <Select
                name="size_id"
                defaultValue={
                  formState.data?.size_id?.toString() ??
                  variant.size_id?.toString() ??
                  "none"
                }
                disabled={isPending}
              >
                <SelectTrigger id="size_id">
                  <SelectValue placeholder="Seleccionar talla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguna / General</SelectItem>
                  {sizes.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} {s.category ? `(${s.category})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={formState.zodErrors?.size_id} />
            </Field>

            <Field>
              <FieldLabel htmlFor="color_id">Color</FieldLabel>
              <Select
                name="color_id"
                defaultValue={
                  formState.data?.color_id?.toString() ??
                  variant.color_id?.toString() ??
                  "none"
                }
                disabled={isPending}
              >
                <SelectTrigger id="color_id">
                  <SelectValue placeholder="Seleccionar color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ninguno</SelectItem>
                  {colors.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      <div className="flex items-center gap-2">
                        {c.hex_code && (
                          <div
                            className="w-3 h-3 rounded-full border shadow-sm"
                            style={{ backgroundColor: c.hex_code }}
                          />
                        )}
                        <span>{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormError error={formState.zodErrors?.color_id} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="track_stock">Inventario</FieldLabel>
              <Select
                name="track_stock"
                value={trackStock}
                onValueChange={setTrackStock}
                disabled={isPending}
              >
                <SelectTrigger id="track_stock">
                  <SelectValue placeholder="¿Rastrear?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Rastrear Stock</SelectItem>
                  <SelectItem value="false">Stock Infinito</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {trackStock === "true" ? (
              <Field>
                <FieldLabel htmlFor="stock">Stock</FieldLabel>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  placeholder="Ej. 10"
                  defaultValue={formState.data?.stock ?? variant.stock ?? "0"}
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.stock} />
              </Field>
            ) : (
              <input type="hidden" name="stock" value="0" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <Field>
              <FieldLabel htmlFor="status">Estado</FieldLabel>
              <Select
                name="status"
                defaultValue={
                  (formState.data?.status as string) ??
                  variant.status ??
                  "activo"
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
          </div>

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

"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateSlug } from "@/lib/utils";
import { CategoryInput } from "@/validations/categories";
import { ActionState } from "@/validations/core";
import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

const INITIAL_STATE: ActionState<CategoryInput> = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export function RegisterCategoryForm() {
  const [formState, formAction, isPending] = useActionState(
    actions.categories.createCategoryAction,
    INITIAL_STATE,
  );

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedFile, setSavedFile] = useState<File | null>(null);

  const [name, setName] = useState(formState.data?.name ?? "");
  const [slug, setSlug] = useState(formState.data?.slug ?? "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato no válido. Solo JPG, PNG o WEBP.");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("La imagen supera el límite de 5MB.");
        e.target.value = "";
        return;
      }

      setSavedFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setSavedFile(null);
      setImagePreview(null);
    }
  };

  const handleAction = (formData: FormData) => {
    const currentFile = formData.get("image") as File;
    if (savedFile && (!currentFile || currentFile.size === 0)) {
      formData.set("image", savedFile);
    }
    startTransition(() => formAction(formData));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Crear Categoría</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Añade una nueva familia de productos a tu tienda.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="image">
                    Imagen Representativa (Opcional)
                  </FieldLabel>

                  <p className="text-[13px] text-muted-foreground">
                    Tamaño recomendado: <b>500 x 500 px</b> (formato cuadrado
                    1:1).
                  </p>

                  <label
                    htmlFor="image"
                    className="mt-2 mb-4 relative mx-auto flex  aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden hover:bg-muted/60 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium text-center px-4">
                          Subir imagen
                        </span>
                      </div>
                    )}
                  </label>

                  <input
                    id="image"
                    type="file"
                    name="image"
                    className="sr-only"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange}
                    disabled={isPending}
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">Nombre de Categoría</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ej. Zapatillas Running"
                      value={name}
                      onChange={handleNameChange}
                      disabled={isPending}
                      autoComplete="name"
                      required
                    />
                    <FormError error={formState.zodErrors?.name} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="slug">Slug (URL Amigable)</FieldLabel>
                    <Input
                      id="slug"
                      name="slug"
                      placeholder="Ej. zapatillas-running"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.slug} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">
                    Descripción (Opcional)
                  </FieldLabel>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Breve detalle sobre la categoría..."
                    defaultValue={formState.data?.description ?? ""}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.description} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Estado Inicial</FieldLabel>
                  <Select
                    name="status"
                    defaultValue={formState.data?.status ?? "activo"}
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

              <Field className="pt-4 border-t mt-4">
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
                  <Button
                    variant="outline"
                    asChild
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    <Link href="/dashboard/categories">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? "Guardando..." : "Crear Categoría"}
                  </Button>
                </div>

                {!formState.success && formState.message && (
                  <p className="text-destructive text-sm text-right mt-2 font-medium">
                    {formState.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

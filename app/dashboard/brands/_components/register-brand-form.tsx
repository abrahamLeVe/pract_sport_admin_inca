"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { SingleImageUploader } from "@/components/single-image-uploader";
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
import { BrandInput } from "@/validations/brands";
import { ActionState } from "@/validations/core";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

const INITIAL_STATE: ActionState<BrandInput> = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export function RegisterBrandForm() {
  const [formState, formAction, isPending] = useActionState(
    actions.brands.createBrandAction,
    INITIAL_STATE,
  );

  const [savedFile, setSavedFile] = useState<File | null>(null);

  const [name, setName] = useState(formState.data?.name ?? "");
  const [slug, setSlug] = useState(formState.data?.slug ?? "");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
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
                <h1 className="text-2xl font-bold">Crear Marca</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Añade una nueva marca a tu tienda.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="image">
                    Imagen Representativa (Opcional)
                  </FieldLabel>

                  <p className="text-[13px] text-muted-foreground">
                    Tamaño mínimo recomendado: <b>800 x 800 px</b> (1:1).
                    Formato preferido: <b>.webp</b>.
                  </p>
                  <div className="w-48 mx-auto mt-2 mb-4">
                    <SingleImageUploader
                      id="image"
                      initialImage={null}
                      onFileSelect={setSavedFile}
                      aspectClass="aspect-square rounded-xl"
                      placeholderText="Cambiar imagen"
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">Nombre de Marca</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Ej. Nike"
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
                      placeholder="Ej. nike"
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
                    placeholder="Breve detalle sobre la marca..."
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
                    <Link href="/dashboard/brands">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? "Guardando..." : "Crear Marca"}
                  </Button>
                </div>

                {!formState.success && formState.message && (
                  <p className="text-destructive text-sm text-right mt-3 font-medium">
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

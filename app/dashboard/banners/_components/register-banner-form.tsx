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
import { BannerInput } from "@/validations/banners";
import { ActionState } from "@/validations/core";
import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

const INITIAL_STATE: ActionState<BannerInput> = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export function BannerForm() {
  const [formState, formAction, isPending] = useActionState(
    actions.banners.createBannerAction,
    INITIAL_STATE,
  );

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedFile, setSavedFile] = useState<File | null>(null);

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
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Registrar Nuevo Banner</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Añade un nuevo banner.{" "}
                  <b>
                    El más reciente aparecerá siempre primero en el carrusel.
                  </b>
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="image">
                    Imagen del Banner (Obligatorio)
                  </FieldLabel>

                  <p className="text-[13px] text-muted-foreground">
                    Tamaño recomendado: <b>1920 x 1080 px</b> (formato 16:9).
                    Peso máximo 5MB.
                  </p>

                  <label
                    htmlFor="image"
                    className="mt-2 mb-2 relative flex aspect-video cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden hover:bg-muted/60 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-contain" // 🔥 Cambiado a object-cover para evitar deformaciones
                      />
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <ImagePlus className="h-10 w-10 mb-3 opacity-50" />
                        <span className="text-sm font-medium">
                          Haz clic aquí para subir una imagen
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
                  {/* <FormError error={formState.zodErrors?.image} /> */}
                </Field>

                <Field>
                  <FieldLabel htmlFor="title">Título Principal</FieldLabel>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Ej. Gran Maratón Inka 2026"
                    defaultValue={formState.data?.title ?? ""}
                    disabled={isPending}
                    required
                  />
                  <FormError error={formState.zodErrors?.title} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="subtitle">
                    Subtítulo (Opcional)
                  </FieldLabel>
                  <Input
                    id="subtitle"
                    name="subtitle"
                    placeholder="Ej. Participa y gana grandes premios"
                    defaultValue={formState.data?.subtitle ?? ""}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.subtitle} />
                </Field>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="link_url">
                    Enlace de Redirección (Opcional)
                  </FieldLabel>
                  <Input
                    id="link_url"
                    name="link_url"
                    placeholder="Ej. /eventos/maraton-2026 o https://..."
                    defaultValue={formState.data?.link_url ?? ""}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.link_url} />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="type">Categoría</FieldLabel>
                    <Select
                      name="type"
                      defaultValue={formState.data?.type ?? "general"}
                      disabled={isPending}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="oferta">Oferta</SelectItem>
                        <SelectItem value="evento">Evento</SelectItem>
                        <SelectItem value="novedad">Novedad</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormError error={formState.zodErrors?.type} />
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

                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="start_date">
                      Fecha Inicio (Opcional)
                    </FieldLabel>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="datetime-local"
                      defaultValue={formState.data?.start_date ?? ""}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.start_date} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="end_date">
                      Fecha Fin (Opcional)
                    </FieldLabel>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="datetime-local"
                      defaultValue={formState.data?.end_date ?? ""}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.end_date} />
                  </Field>
                </div>
              </div>

              <Field className="md:col-span-2 pt-4 border-t mt-2">
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
                  <Button
                    variant="outline"
                    asChild
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    <Link href="/dashboard/banners">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending
                      ? "Subiendo a la nube..."
                      : "Subir y Crear Banner"}
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

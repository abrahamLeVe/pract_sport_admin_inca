"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { FormFeedback } from "@/components/form-feedback";
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
import { BannerInput } from "@/validations/banners";
import { ActionState } from "@/validations/core";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

const INITIAL_STATE: ActionState<BannerInput> = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

interface Events {
  id: number;
  title: string;
}

interface BannerFormProps {
  events: Events[];
}

export function BannerForm({ events }: BannerFormProps) {
  const [formState, formAction, isPending] = useActionState(
    actions.banners.createBannerAction,
    INITIAL_STATE,
  );

  const [savedFile, setSavedFile] = useState<File | null>(null);

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
                    Tamaño mínimo recomendado: <b>1920 x 1080 px</b> (formato
                    16:9). Peso máximo 5MB. Formato preferido: <b>.webp</b>.
                  </p>

                  <div className="w-48 mx-auto mt-2 mb-4">
                    <SingleImageUploader
                      id="image"
                      initialImage={null}
                      onFileSelect={setSavedFile}
                      aspectClass="aspect-video rounded-xl"
                      placeholderText="Cambiar imagen"
                    />
                  </div>
                  <FormError error={formState.zodErrors?.image} />
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

              <Field>
                <FieldLabel htmlFor="event_id">
                  Vincular a un Evento (Opcional)
                </FieldLabel>
                <Select
                  name="event_id"
                  defaultValue={
                    formState.data?.event_id
                      ? String(formState.data.event_id)
                      : "none"
                  }
                  disabled={isPending}
                >
                  <SelectTrigger id="event_id">
                    <SelectValue placeholder="Selecciona un evento si deseas vincularlo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguno (No vincular)</SelectItem>

                    {events.map((event) => (
                      <SelectItem key={event.id} value={String(event.id)}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormError error={formState.zodErrors?.event_id} />
              </Field>

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
                <FormFeedback formState={formState} />
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

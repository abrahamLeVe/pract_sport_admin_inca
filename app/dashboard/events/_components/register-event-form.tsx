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
import { FormEventState } from "@/validations/events";
import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

const INITIAL_STATE: FormEventState = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export function RegisterEventForm() {
  const [formState, formAction, isPending] = useActionState(
    actions.events.createEventAction,
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
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Crear Evento</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Registra una nueva carrera, triatlón o entrenamiento para el
                  club.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="image">
                    Afiche del Evento (Opcional)
                  </FieldLabel>

                  <p className="text-[13px] text-muted-foreground">
                    Tamaño recomendado: <b>800 x 800 px</b> (formato cuadrado o
                    vertical).
                  </p>

                  <label
                    htmlFor="image"
                    className="mt-2 mb-4 relative mx-auto flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden hover:bg-muted/60 transition-colors"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                        <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-xs font-medium text-center px-4">
                          Subir afiche
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
                  <FormError error={formState.zodErrors?.image as any} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="title">Título del Evento</FieldLabel>
                    <Input
                      id="title"
                      name="title"
                      placeholder="Ej. Desafío Arwaturo 10K"
                      defaultValue={formState.data?.title ?? ""}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.title} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="event_date">Fecha y Hora</FieldLabel>
                    <Input
                      id="event_date"
                      name="event_date"
                      type="datetime-local"
                      defaultValue={formState.data?.event_date ?? ""}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.event_date} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="location">Ubicación</FieldLabel>
                    <Input
                      id="location"
                      name="location"
                      placeholder="Ej. Laguna Ñawinpuquio"
                      defaultValue={formState.data?.location ?? ""}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.location} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="event_type">Disciplina</FieldLabel>
                    <Select
                      name="event_type"
                      defaultValue={formState.data?.event_type ?? ""}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger id="event_type">
                        <SelectValue placeholder="Selecciona disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="running">
                          Running / Atletismo
                        </SelectItem>
                        <SelectItem value="triatlon">Triatlón</SelectItem>
                        <SelectItem value="duatlon">Duatlón</SelectItem>
                        <SelectItem value="trail">Trail Running</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormError error={formState.zodErrors?.event_type} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="distances">
                      Distancias (Opcional)
                    </FieldLabel>
                    <Input
                      id="distances"
                      name="distances"
                      placeholder="Ej. 750m natación / 20km bici / 5km trote"
                      defaultValue={formState.data?.distances ?? ""}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.distances} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="max_participants">
                      Cupos Máximos (Opcional)
                    </FieldLabel>
                    <Input
                      id="max_participants"
                      name="max_participants"
                      type="number"
                      min="1"
                      placeholder="Ej. 150"
                      defaultValue={formState.data?.max_participants ?? ""}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.max_participants} />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="description">
                    Descripción (Opcional)
                  </FieldLabel>
                  <Input
                    id="description"
                    name="description"
                    placeholder="Detalles de la ruta, punto de encuentro, etc..."
                    defaultValue={formState.data?.description ?? ""}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.description} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Estado Inicial</FieldLabel>
                  <Select
                    name="status"
                    defaultValue={formState.data?.status ?? "draft"}
                    disabled={isPending}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador (Oculto)</SelectItem>
                      <SelectItem value="published">
                        Publicado (Visible)
                      </SelectItem>
                      <SelectItem value="completed">Finalizado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
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
                    <Link href="/dashboard/events">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? "Guardando..." : "Crear Evento"}
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

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
import { EditBannerFormProps, EditBannerInput } from "@/validations/banners";
import { ActionState } from "@/validations/core";
import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";

const formatDateForInput = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export function EditBannerForm({ initialData, events }: EditBannerFormProps) {
  const initialState: ActionState<EditBannerInput> = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: initialData.id, // ✅ Quitamos el String(), ahora es number
      title: initialData.title || "",
      subtitle: initialData.subtitle || "",
      link_url: initialData.link_url || "",
      type: initialData.type,
      status: initialData.status,
      sort_order: initialData.sort_order,
      start_date: formatDateForInput(initialData.start_date),
      end_date: formatDateForInput(initialData.end_date),
      event_id: initialData.event_id,
    },
  };

  const [formState, formAction, isPending] = useActionState(
    actions.banners.updateBannerAction,
    initialState,
  );

  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData.image_url,
  );
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
      setImagePreview(initialData.image_url);
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
            <input type="hidden" name="id" value={initialData.id} />
            <input
              type="hidden"
              name="sort_order"
              value={initialData.sort_order}
            />

            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Editar Banner</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Actualiza la información o reemplaza la imagen del banner.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="image">Nueva Imagen (Opcional)</FieldLabel>
                <p className="text-[13px] text-muted-foreground">
                  Tamaño mínimo recomendado: <b>1920 x 1080 px</b> (formato
                  16:9). Peso máximo 5MB. Formato preferido: <b>.webp</b>.
                </p>
                <div className="w-48 mx-auto mt-2 mb-4">
                  <SingleImageUploader
                    id="image"
                    initialImage={initialData.image_url}
                    onFileSelect={setSavedFile}
                    aspectClass="aspect-video rounded-xl"
                    placeholderText="Cambiar imagen"
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="title">Título Principal</FieldLabel>
                <Input
                  id="title"
                  type="text"
                  name="title"
                  placeholder="Ej. Gran Maratón Inka 2026"
                  defaultValue={String(formState.data?.title ?? "")}
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.title} />
              </Field>

              <Field>
                <FieldLabel htmlFor="subtitle">Subtítulo (Opcional)</FieldLabel>
                <Input
                  id="subtitle"
                  type="text"
                  name="subtitle"
                  placeholder="Ej. Participa y gana grandes premios"
                  defaultValue={String(formState.data?.subtitle ?? "")}
                  disabled={isPending}
                />
                <FormError error={formState.zodErrors?.subtitle} />
              </Field>

              <Field>
                <FieldLabel htmlFor="link_url">
                  Enlace de Redirección (Opcional)
                </FieldLabel>
                <Input
                  id="link_url"
                  type="text"
                  name="link_url"
                  placeholder="Ej. /eventos/maraton-2026 o https://..."
                  defaultValue={String(formState.data?.link_url ?? "")}
                  disabled={isPending}
                />
                <FormError error={formState.zodErrors?.link_url} />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="type">Categoría</FieldLabel>
                  <Select
                    name="type"
                    defaultValue={String(formState.data?.type ?? "general")}
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
                  <FieldLabel htmlFor="status">Estado Operativo</FieldLabel>
                  <Select
                    name="status"
                    defaultValue={String(formState.data?.status ?? "activo")}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="start_date">
                    Fecha Inicio (Opcional)
                  </FieldLabel>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    name="start_date"
                    defaultValue={String(formState.data?.start_date ?? "")}
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
                    type="datetime-local"
                    name="end_date"
                    defaultValue={String(formState.data?.end_date ?? "")}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.end_date} />
                </Field>
              </div>
              <Field>
                <FieldLabel htmlFor="event_id">
                  Vincular a un Evento (Opcional)
                </FieldLabel>
                <Select
                  name="event_id"
                  defaultValue={
                    formState.data?.event_id != null
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
                    className="w-full sm:w-auto"
                    disabled={isPending}
                  >
                    {isPending ? "Actualizando banner..." : "Guardar Cambios"}
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

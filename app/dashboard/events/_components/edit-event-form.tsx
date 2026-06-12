"use client";

import { updateEventAction } from "@/app/actions/events";
import { FormError } from "@/components/form-error";
import { RichTextEditor } from "@/components/rich-text-editor";
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
import { EditEventFormProps } from "@/validations/events";
import { ImagePlus } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";
import { RoutePreviewMap } from "./route-preview-map";

export function EditEventForm({ initialData, eventTypes }: EditEventFormProps) {
  const formatDateTimeLocal = (dateInput?: Date | string) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: String(initialData.id),
      title: initialData.title || "",
      description: initialData.description || "",
      event_date: formatDateTimeLocal(initialData.event_date),
      location_name: initialData.location_name || "",
      latitude: initialData.latitude || "",
      longitude: initialData.longitude || "",
      route_geojson: initialData.route_geojson || "",
      event_type_id: initialData.event_type_id || "",
      status: initialData.status,
    } as Record<string, any>,
  };

  const [formState, formAction, isPending] = useActionState(
    updateEventAction,
    initialState,
  );

  const [geojsonInput, setGeojsonInput] = useState(
    initialData.route_geojson
      ? JSON.stringify(initialData.route_geojson, null, 2)
      : "",
  );
  const [description, setDescription] = useState(initialState.data.description);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData.image_url ?? null,
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
      setImagePreview(initialData.image_url ?? null);
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

            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Editar Evento</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Actualiza la información básica o el afiche del evento
                  deportivo.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="image">
                    Nuevo Afiche del Evento (Opcional)
                  </FieldLabel>

                  <p className="text-[13px] text-muted-foreground">
                    Tamaño recomendado: <b>800 x 800 px</b> (formato cuadrado o
                    vertical).
                  </p>

                  <label
                    htmlFor="image"
                    className="mt-2 mb-4 relative mx-auto flex w-48 aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden hover:bg-muted/60 transition-colors"
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
                          Cambiar afiche
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
                    <FieldLabel htmlFor="event_type_id">
                      Disciplina (Tipo de Evento)
                    </FieldLabel>
                    <Select
                      name="event_type_id"
                      defaultValue={
                        formState.data?.event_type_id?.toString() ?? ""
                      }
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger id="event_type_id">
                        <SelectValue placeholder="Selecciona disciplina" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormError error={formState.zodErrors?.event_type_id} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="location_name">Ubicación</FieldLabel>
                    <Input
                      id="location_name"
                      name="location_name"
                      placeholder="Ej. Laguna Ñawinpuquio"
                      defaultValue={formState.data?.location_name ?? ""}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.location_name} />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="latitude">
                      Latitud (Opcional - Maps)
                    </FieldLabel>
                    <Input
                      id="latitude"
                      name="latitude"
                      type="number"
                      step="any"
                      placeholder="Ej. -12.0651"
                      defaultValue={formState.data?.latitude ?? ""}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.latitude} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="longitude">
                      Longitud (Opcional - Maps)
                    </FieldLabel>
                    <Input
                      id="longitude"
                      name="longitude"
                      type="number"
                      step="any"
                      placeholder="Ej. -75.2048"
                      defaultValue={formState.data?.longitude ?? ""}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.longitude} />
                  </Field>
                </div>

                <Field className="md:col-span-2">
                  {" "}
                  {/* Si estás en un grid, haz que ocupe todo el ancho */}
                  <FieldLabel htmlFor="route_geojson">
                    Ruta del Evento (GeoJSON)
                  </FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-75 mt-2">
                    {/* COLUMNA IZQUIERDA: EL TEXTAREA */}
                    <textarea
                      id="route_geojson"
                      name="route_geojson"
                      className="w-full h-full p-3 border rounded-md font-mono text-xs resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder='{"type": "Feature", ...}'
                      value={geojsonInput}
                      onChange={(e) => setGeojsonInput(e.target.value)}
                      disabled={isPending}
                    />

                    {/* COLUMNA DERECHA: EL MAPA EN VIVO */}
                    <div className="w-full h-full border rounded-md overflow-hidden bg-background">
                      <RoutePreviewMap geoJsonString={geojsonInput} />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Puedes crear tu ruta en Google My Maps, exportarla a KML y
                    convertirla a GeoJSON.
                  </p>
                </Field>

                <Field>
                  <div className="text-sm font-medium leading-none mb-1">
                    Descripción (Opcional)
                  </div>

                  <input type="hidden" name="description" value={description} />

                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    disabled={isPending}
                  />

                  <FormError error={formState.zodErrors?.description} />
                </Field>

                <Field className="border-t pt-6">
                  <FieldLabel htmlFor="status">Estado del Evento</FieldLabel>
                  <Select
                    name="status"
                    defaultValue={formState.data?.status ?? "draft"}
                    disabled={isPending}
                  >
                    <SelectTrigger id="status" className="w-full sm:w-64">
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
                    {isPending ? "Actualizando..." : "Guardar Cambios"}
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

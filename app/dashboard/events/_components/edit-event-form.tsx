"use client";

import { updateEventAction } from "@/app/actions/events/crud";
import { FormError } from "@/components/form-error";
import { RichTextEditor } from "@/components/rich-text-editor";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeLocal, generateSlug } from "@/lib/utils";
import { EditEventFormProps } from "@/validations/events";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { RoutePreviewMap } from "./route-preview-map";

export function EditEventForm({ initialData, eventTypes }: EditEventFormProps) {
  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: String(initialData.id),
      title: initialData.title || "",
      slug: initialData.slug || "",
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

  const [name, setName] = useState<string>(initialData.title || "");
  const [slug, setSlug] = useState<string>(initialData.slug || "");

  const [geojsonInput, setGeojsonInput] = useState(
    initialData.route_geojson
      ? JSON.stringify(initialData.route_geojson, null, 2)
      : "",
  );
  const [description, setDescription] = useState(initialState.data.description);

  const [savedFile, setSavedFile] = useState<File | null>(null);

  const handleAction = (formData: FormData) => {
    const currentFile = formData.get("image") as File;
    if (savedFile && (!currentFile || currentFile.size === 0)) {
      formData.set("image", savedFile);
    }
    startTransition(() => formAction(formData));
  };
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
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
                    Tamaño mínimo recomendado: <b>800 x 800 px</b> (1:1).
                    Formato preferido: <b>.webp</b>.
                  </p>
                  <div className="max-w-lg mx-auto mt-2 mb-4">
                    <SingleImageUploader
                      id="image"
                      initialImage={initialData.image_url}
                      onFileSelect={setSavedFile}
                      aspectClass="aspect-square rounded-xl"
                      placeholderText="Cambiar imagen"
                    />
                  </div>
                  <FormError error={formState.zodErrors?.image} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="title">Título del Evento</FieldLabel>
                    <Input
                      id="title"
                      name="title"
                      value={name}
                      placeholder="Ej. Desafío Arwaturo 10K"
                      onChange={handleNameChange}
                      disabled={isPending}
                      autoComplete="off"
                      required
                    />
                    <FormError error={formState.zodErrors?.title} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="slug">Slug (URL Amigable)</FieldLabel>
                    <Input
                      id="slug"
                      name="slug"
                      placeholder="Ej. desafio-arwaturo-10k"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.slug} />
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {/* 🔥 Columna 1: Label y Textarea juntos y abrazados en el mismo contenedor */}
                    <div className="flex flex-col gap-2">
                      <FieldLabel htmlFor="route_geojson">
                        Ruta del Evento (GeoJSON)
                      </FieldLabel>
                      <Textarea
                        id="route_geojson"
                        name="route_geojson"
                        className="h-48 md:h-75 resize-none font-mono text-xs"
                        placeholder='{
                                      "type": "FeatureCollection",
                                      "features": [
                                        {
                                          "type": "Feature",
                                          "geometry": {
                                            "type": "LineString",
                                            "coordinates": [
                                              [-75.2034, -12.07252],
                                              [-75.19589, -12.05004]
                                            ]
                                          }
                                        }
                                      ]
                                    }'
                        defaultValue={geojsonInput}
                        onChange={(e) => setGeojsonInput(e.target.value)}
                        disabled={isPending}
                      />
                    </div>

                    {/* 🔥 Columna 2: El mapa aislado en su propia caja */}
                    <div className="flex flex-col gap-2">
                      {/* Spacer opcional para que el mapa baje y se alinee perfectamente con el textarea en pantallas grandes */}
                      <div className="h-5 hidden md:block"></div>
                      <div className="w-full h-64 md:h-75 border rounded-md overflow-hidden bg-background">
                        <RoutePreviewMap geoJsonString={geojsonInput} />
                      </div>
                    </div>
                  </div>

                  {/* Mensaje de ayuda (se queda afuera, sin interrumpir al label) */}
                  <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed">
                    <strong>Pasos:</strong> 1. Crea tu ruta en{" "}
                    <a
                      href="https://www.google.com/mymaps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Google My Maps
                    </a>
                    . 2. Exporta la capa a formato KML. 3. Conviértela usando un{" "}
                    <a
                      href="https://mygeodata.cloud/converter/kml-to-geojson"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Conversor KML a GeoJSON
                    </a>
                    .
                    <br />
                    💡{" "}
                    <em>
                      ¿Dudas con el formato? Revisa la estructura correcta
                      abriendo el ejemplo aquí:{" "}
                      <a
                        href="/ejemplo-geojson.txt"
                        target="_blank"
                        className="text-blue-500 hover:underline"
                      >
                        /ejemplo-geojson.txt
                      </a>
                    </em>
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

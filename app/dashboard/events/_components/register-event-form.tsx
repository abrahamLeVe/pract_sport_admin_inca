"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Badge } from "@/components/ui/badge";
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
import { ActionState } from "@/validations/core";
import { EventInput, RegisterEventFormProps } from "@/validations/events";
import { ImagePlus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { toast } from "sonner";
import { RoutePreviewMap } from "./route-preview-map";

const INITIAL_STATE: ActionState<EventInput> = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export function RegisterEventForm({
  eventTypes,
  distances,
  genders,
  ageCategories,
}: RegisterEventFormProps) {
  const [formState, formAction, isPending] = useActionState(
    actions.events.createEventAction,
    INITIAL_STATE,
  );
  const [description, setDescription] = useState(
    formState.data?.description ?? "",
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savedFile, setSavedFile] = useState<File | null>(null);

  const [categories, setCategories] = useState<any[]>(
    formState.data?.categories || [],
  );
  const [newCat, setNewCat] = useState({
    distance_id: "",
    gender_id: "",
    age_category_id: "",
    applied_min_age: "",
    applied_max_age: "",
    price: "",
    cupos: "",
  });

  const [geojsonInput, setGeojsonInput] = useState(
    formState.data?.route_geojson
      ? JSON.stringify(formState.data.route_geojson, null, 2)
      : "",
  );

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

  const addCategory = () => {
    if (!newCat.distance_id || !newCat.gender_id || !newCat.age_category_id) {
      toast.error("Faltan seleccionar datos maestros para la categoría.");
      return;
    }

    const newMin = Number(newCat.applied_min_age) || 0;
    const newMax = Number(newCat.applied_max_age) || 99;
    const distId = Number(newCat.distance_id);
    const genId = Number(newCat.gender_id);
    const ageCatId = Number(newCat.age_category_id);

    // 1. Validar lógica básica de edades
    if (newMin >= newMax) {
      toast.error("La edad mínima debe ser estrictamente menor que la máxima.");
      return;
    }

    // 2. Validar que no exista exactamente la misma categoría de nombre
    const isExactDuplicate = categories.some(
      (cat) =>
        cat.distance_id === distId &&
        cat.gender_id === genId &&
        cat.age_category_id === ageCatId,
    );

    if (isExactDuplicate) {
      toast.error("Esta categoría exacta ya está en la lista.");
      return;
    }

    // 3. 🔥 EL FIX: Validar Solapamiento (Cruce de Edades)
    // Dos rangos se solapan si: (Min A <= Max B) y (Max A >= Min B)
    const isOverlapping = categories.some((cat) => {
      // Solo comparamos si están compitiendo en la misma distancia y género
      if (cat.distance_id !== distId || cat.gender_id !== genId) return false;

      return newMin <= cat.applied_max_age && newMax >= cat.applied_min_age;
    });

    if (isOverlapping) {
      toast.error(
        "¡Cruce de edades! Este rango choca con otra categoría existente. Intenta usar rangos sin repetir números (ej: 6-11 y 12-17).",
      );
      return;
    }

    // Si pasa todas las validaciones, lo agregamos
    setCategories([
      ...categories,
      {
        distance_id: distId,
        gender_id: genId,
        age_category_id: ageCatId,
        applied_min_age: newMin,
        applied_max_age: newMax,
        price: Number(newCat.price) || 0,
        cupos: Number(newCat.cupos) || 0,
      },
    ]);

    // Limpiamos el formulario temporal
    setNewCat({
      distance_id: "",
      gender_id: "",
      age_category_id: "",
      applied_min_age: "",
      applied_max_age: "",
      price: "",
      cupos: "",
    });
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleAction = (formData: FormData) => {
    if (categories.length === 0) {
      toast.error("Debes agregar al menos una categoría al evento.");
    }

    const currentFile = formData.get("image") as File;
    if (savedFile && (!currentFile || currentFile.size === 0)) {
      formData.set("image", savedFile);
    }

    formData.append("categories", JSON.stringify(categories));

    startTransition(() => formAction(formData));
  };

  const getDistanceName = (id: number) =>
    distances.find((d) => d.id === id)?.name;
  const getGenderName = (id: number) => genders.find((g) => g.id === id)?.name;
  const getAgeCatName = (id: number) =>
    ageCategories.find((a) => a.id === id)?.name;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Crear Evento</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Registra la información del evento y sus categorías
                  (distancias, edades, precios).
                </p>
              </div>

              <div className="flex flex-col gap-6 mb-8 border-b pb-8">
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
                    className="mt-2 mb-4 relative mx-auto flex aspect-square max-w-lg cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden hover:bg-muted/60 transition-colors"
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
                  <FieldLabel htmlFor="route_geojson">
                    Ruta del Evento (GeoJSON)
                  </FieldLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <Textarea
                      id="route_geojson"
                      name="route_geojson"
                      className="h-48 md:h-75 resize-none"
                      placeholder='{
                      "type": "Feature",
                      "geometry": {
                        "type": "LineString",
                        "coordinates": [
                          [-75.19589, -12.05004],
                          ...,
                          [-75.1924, -12.03894]
                        ]
                      }
                    }'
                      defaultValue={geojsonInput}
                      onChange={(e) => setGeojsonInput(e.target.value)}
                      disabled={isPending}
                    />
                    <div className="w-full h-64 md:h-75 border rounded-md overflow-hidden bg-background">
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
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Categorías del Evento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Define las reglas, precios y cupos.
                    </p>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg border mb-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Select
                      name="temp_distance_id"
                      value={newCat.distance_id}
                      onValueChange={(val) =>
                        setNewCat({ ...newCat, distance_id: val })
                      }
                    >
                      {/* 🔥 FIX: Se agregaron IDs a los selects temporales */}
                      <SelectTrigger id="temp_distance_id">
                        <SelectValue placeholder="Distancia..." />
                      </SelectTrigger>
                      <SelectContent>
                        {distances.map((d) => (
                          <SelectItem key={d.id} value={d.id.toString()}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      name="temp_gender_id"
                      value={newCat.gender_id}
                      onValueChange={(val) =>
                        setNewCat({ ...newCat, gender_id: val })
                      }
                    >
                      <SelectTrigger id="temp_gender_id">
                        <SelectValue placeholder="Género..." />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map((g) => (
                          <SelectItem key={g.id} value={g.id.toString()}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      name="temp_age_category_id"
                      value={newCat.age_category_id}
                      onValueChange={(val) => {
                        const ageCat = ageCategories.find(
                          (a) => a.id.toString() === val,
                        );
                        setNewCat({
                          ...newCat,
                          age_category_id: val,
                          applied_min_age:
                            ageCat?.default_min_age.toString() || "",
                          applied_max_age:
                            ageCat?.default_max_age.toString() || "",
                        });
                      }}
                    >
                      <SelectTrigger id="temp_age_category_id">
                        <SelectValue placeholder="Categoría de Edad..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ageCategories.map((a) => (
                          <SelectItem key={a.id} value={a.id.toString()}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* 🔥 FIX: Se agregaron IDs a los inputs temporales */}
                    <Input
                      id="temp_min_age"
                      name="temp_min_age"
                      type="number"
                      placeholder="Edad Min."
                      value={newCat.applied_min_age}
                      onChange={(e) =>
                        setNewCat({
                          ...newCat,
                          applied_min_age: e.target.value,
                        })
                      }
                      title="Edad Mínima"
                    />
                    <Input
                      id="temp_max_age"
                      name="temp_max_age"
                      type="number"
                      placeholder="Edad Max."
                      value={newCat.applied_max_age}
                      onChange={(e) =>
                        setNewCat({
                          ...newCat,
                          applied_max_age: e.target.value,
                        })
                      }
                      title="Edad Máxima"
                    />
                    <Input
                      id="temp_price"
                      name="temp_price"
                      type="number"
                      placeholder="Precio (S/)"
                      value={newCat.price}
                      onChange={(e) =>
                        setNewCat({ ...newCat, price: e.target.value })
                      }
                      title="Precio"
                    />
                    <Input
                      id="temp_cupos"
                      name="temp_cupos"
                      type="number"
                      placeholder="Cupos (0=Ilimitado)"
                      value={newCat.cupos}
                      onChange={(e) =>
                        setNewCat({ ...newCat, cupos: e.target.value })
                      }
                      title="Cupos Máximos"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={addCategory}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Agregar a la lista
                  </Button>
                </div>

                {categories.length === 0 ? (
                  <div className="text-center p-4 border border-dashed rounded-lg text-muted-foreground text-sm">
                    No has agregado ninguna categoría.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {categories.map((cat, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-card gap-2"
                      >
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="outline" className="font-semibold">
                            {getDistanceName(cat.distance_id)}
                          </Badge>
                          <Badge variant="outline">
                            {getGenderName(cat.gender_id)}
                          </Badge>
                          <Badge variant="default">
                            {getAgeCatName(cat.age_category_id)}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-2">
                            ({cat.applied_min_age} - {cat.applied_max_age} años)
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                          <span>S/ {cat.price}</span>
                          <span className="text-muted-foreground">
                            {cat.cupos === 0
                              ? "Ilimitado"
                              : `${cat.cupos} cupos`}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeCategory(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <FormError error={formState.zodErrors?.categories as any} />
              </div>

              <Field className="border-t pt-6">
                <FieldLabel htmlFor="status">
                  Estado Inicial del Evento
                </FieldLabel>
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
                  </SelectContent>
                </Select>
                <FormError error={formState.zodErrors?.status} />
              </Field>

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
                    {isPending
                      ? "Guardando Evento Completo..."
                      : "Guardar Evento y Categorías"}
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

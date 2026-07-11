"use client";

import { actions } from "@/app/actions";
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
import { generateSlug } from "@/lib/utils";
import { ActionState } from "@/validations/core";
import { ProductInput, RegisterProductFormProps } from "@/validations/products";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { FormFeedback } from "@/components/form-feedback";
import { MediaUploader, UploadItem } from "@/components/media-uploader";

const INITIAL_STATE: ActionState<ProductInput> = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export function RegisterProductForm({
  categories,
  brands,
  genders,
}: RegisterProductFormProps) {
  const [formState, formAction, isPending] = useActionState(
    actions.products.createProductAction,
    INITIAL_STATE,
  );
  const [name, setName] = useState(formState.data?.name ?? "");
  const [slug, setSlug] = useState(formState.data?.slug ?? "");
  const [description, setDescription] = useState(
    formState.data?.description ?? "",
  );
  const [trackStock, setTrackStock] = useState(
    formState.data?.track_stock !== false ? "true" : "false",
  );

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [coverItems, setCoverItems] = useState<UploadItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<UploadItem[]>([]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setSlug(generateSlug(e.target.value));
  };

  const handleAction = (formData: FormData) => {
    // Portada
    if (coverItems.length > 0 && coverItems[0].file) {
      formData.append("image", coverItems[0].file);
    }

    // Galería: Solo enviamos archivos nuevos, no requerimos mapa de orden en creación porque todas son nuevas y su orden es su posición en el array
    galleryItems.forEach((item) => {
      if (item.file) formData.append("gallery_files", item.file);
    });

    startTransition(() => formAction(formData));
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8" autoComplete="off">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Crear Producto</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Añade un nuevo producto a tu catálogo.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <MediaUploader
                    id="cover-upload"
                    label="Portada (Obligatorio)"
                    description="Máx. 1MB. Formato recomendado .webp en dimensiones cuadradas (mínimo 800px x 800px)."
                    maxFiles={1}
                    onItemsChange={setCoverItems}
                  />
                  <FormError error={formState.zodErrors?.image} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="name">Nombre del Producto</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      value={name}
                      onChange={handleNameChange}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.name} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="slug">Slug</FieldLabel>
                    <Input
                      id="slug"
                      name="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.slug} />
                  </Field>
                </div>

                <Field>
                  <div className="text-sm font-medium leading-none mb-1">
                    Descripción del Producto
                  </div>
                  <input type="hidden" name="description" value={description} />
                  <RichTextEditor
                    value={description}
                    onChange={setDescription}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.description} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="price">Precio (S/)</FieldLabel>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      defaultValue={formState.data?.price ?? ""}
                      disabled={isPending}
                      required
                    />
                    <FormError error={formState.zodErrors?.price} />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="discount_price">
                      Precio Descuento (Opcional)
                    </FieldLabel>
                    <Input
                      id="discount_price"
                      name="discount_price"
                      type="number"
                      step="0.01"
                      defaultValue={formState.data?.discount_price ?? ""}
                      disabled={isPending}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field>
                    <FieldLabel htmlFor="category_id">Categoría</FieldLabel>
                    <Select
                      name="category_id"
                      defaultValue={
                        formState.data?.category_id?.toString() ?? ""
                      }
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="brand_id">Marca</FieldLabel>
                    <Select
                      name="brand_id"
                      defaultValue={formState.data?.brand_id?.toString() ?? ""}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger id="brand_id">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="gender_id">Género</FieldLabel>
                    <Select
                      name="gender_id"
                      defaultValue={formState.data?.gender_id?.toString() ?? ""}
                      disabled={isPending}
                      required
                    >
                      <SelectTrigger id="gender_id">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {genders.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="track_stock">
                      Control de Inventario
                    </FieldLabel>
                    <Select
                      name="track_stock"
                      value={trackStock}
                      onValueChange={setTrackStock}
                      disabled={isPending}
                    >
                      <SelectTrigger id="track_stock">
                        <SelectValue placeholder="¿Controlar?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          Sí, controlar unidades
                        </SelectItem>
                        <SelectItem value="false">No, infinito</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  {trackStock === "true" ? (
                    <Field>
                      <FieldLabel htmlFor="stock">Stock Inicial</FieldLabel>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        defaultValue={formState.data?.stock ?? ""}
                        disabled={isPending}
                        required
                      />
                    </Field>
                  ) : (
                    <input type="hidden" name="stock" value="0" />
                  )}
                </div>

                <Field>
                  <MediaUploader
                    id="gallery-upload"
                    label="Galería del producto (Opcional)"
                    description="Sube las imágenes o videos que necesites (hasta 20). El único límite es que juntos no deben superar los 10MB (máx. 1MB por archivo). Para una optimización ideal, se recomienda el formato .webp y dimensiones cuadradas (mínimo 800px x 800px)."
                    maxFiles={20}
                    accept="image/*,video/*"
                    onItemsChange={setGalleryItems}
                  />
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
                    <Link href="/dashboard/products">Cancelar</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    {isPending ? "Guardando..." : "Crear Producto"}
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

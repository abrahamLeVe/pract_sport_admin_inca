"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { FormFeedback } from "@/components/form-feedback";
import { MediaUploader, UploadItem } from "@/components/media-uploader";
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
import { generateSlug, getCleanFileNameFromUrl } from "@/lib/utils";
import { EditProductFormProps } from "@/validations/products";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

export function EditProductForm({
  initialData,
  categories,
  brands,
  genders,
}: EditProductFormProps) {
  const hasVariants = Boolean(initialData.has_variants);

  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: initialData.id,
      name: initialData.name || "",
      slug: initialData.slug || "",
      description: initialData.description || "",
      price: initialData.price,
      discount_price: initialData.discount_price ?? undefined,
      stock: initialData.stock,
      category_id: initialData.category_id,
      brand_id: initialData.brand_id,
      gender_id: initialData.gender_id,
      status: (initialData.status as "activo" | "inactivo") || "activo",
      track_stock: initialData.track_stock !== false,
    },
  };

  const [formState, formAction, isPending] = useActionState(
    actions.products.updateProductAction,
    initialState,
  );

  const [name, setName] = useState<string>(initialData.name || "");
  const [slug, setSlug] = useState<string>(initialData.slug || "");
  const [description, setDescription] = useState<string>(
    initialData.description || "",
  );
  const initialTrackStock =
    initialData.track_stock !== false ? "true" : "false";
  const [trackStock, setTrackStock] = useState(initialTrackStock);
  const isTrackStockChanged = trackStock !== initialTrackStock;

  const initialCover: UploadItem[] =
    initialData.image_url && initialData.image_key
      ? [
          {
            id: initialData.image_key,
            url: initialData.image_url,
            key: initialData.image_key,
            name: getCleanFileNameFromUrl(initialData.image_url),
          },
        ]
      : [];

  const initialGalleryData =
    typeof initialData.images === "string"
      ? JSON.parse(initialData.images)
      : initialData.images || [];

  const initialGallery: UploadItem[] = initialGalleryData.map((img: any) => ({
    id: img.key,
    url: img.url,
    key: img.key,
    name: img.file_name || img.name || getCleanFileNameFromUrl(img.url),
    size: img.size_bytes || img.size || undefined, // 🔥 Recibimos el peso de la base de datos
  }));

  const [coverItems, setCoverItems] = useState<UploadItem[]>(initialCover);
  const [galleryItems, setGalleryItems] =
    useState<UploadItem[]>(initialGallery);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setSlug(generateSlug(e.target.value));
  };

  const handleAction = (formData: FormData) => {
    if (coverItems.length > 0 && coverItems[0].file) {
      formData.append("image", coverItems[0].file);
    }

    const galleryOrder = galleryItems.map((item) => {
      if (item.file) {
        formData.append("gallery_files", item.file);
        return { type: "new" };
      } else {
        return { type: "existing", key: item.key };
      }
    });

    formData.append("gallery_order", JSON.stringify(galleryOrder));

    if (trackStock === "false") formData.set("stock", "0");
    startTransition(() => formAction(formData));
  };

  return (
    <Card>
      <CardContent>
        <form action={handleAction} className="p-6 md:p-8" autoComplete="off">
          <input type="hidden" name="id" value={initialData.id} />

          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center mb-4">
              <h1 className="text-2xl font-bold">Editar Producto</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Actualiza y reordena la información de este artículo.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <Field>
                <MediaUploader
                  id="cover-upload"
                  label="Portada Principal"
                  description="Sube las imágenes o videos que necesites (hasta 20). El único límite es que juntos no deben superar los 10MB (máx. 1MB por archivo). Para una optimización ideal, se recomienda el formato .webp y dimensiones cuadradas (mínimo 800px x 800px)."
                  maxFiles={1}
                  initialItems={initialCover}
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
                    autoComplete="off"
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
                  Descripción
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
                    defaultValue={formState.data?.price}
                    disabled={isPending}
                    required
                  />
                  <FormError error={formState.zodErrors?.price} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="discount_price">
                    Precio Descuento
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
                    defaultValue={formState.data?.category_id?.toString()}
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
                    defaultValue={formState.data?.brand_id?.toString()}
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
                    defaultValue={formState.data?.gender_id?.toString()}
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
                  <FieldLabel htmlFor="status">Estado Operativo</FieldLabel>
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
                {!hasVariants ? (
                  <>
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
                        <FieldLabel htmlFor="stock">Stock Total</FieldLabel>
                        <Input
                          id="stock"
                          name="stock"
                          type="number"
                          defaultValue={formState.data?.stock}
                          disabled={isPending}
                          required
                        />
                      </Field>
                    ) : (
                      <input type="hidden" name="stock" value="0" />
                    )}
                  </>
                ) : (
                  <div className="col-span-1 md:col-span-2 bg-muted/30 p-4 rounded-lg border border-dashed text-center">
                    <p className="text-sm text-muted-foreground font-medium">
                      📦 Inventario gestionado desde variantes.
                    </p>
                    <input type="hidden" name="track_stock" value="true" />
                    <input
                      type="hidden"
                      name="stock"
                      value={initialData.stock}
                    />
                  </div>
                )}
              </div>

              <Field>
                <MediaUploader
                  id="gallery-upload"
                  label="Galería de Imágenes"
                  description="Sube las imágenes o videos que necesites (hasta 20). El único límite es que juntos no deben superar los 10MB (máx. 1MB por archivo)."
                  maxFiles={20}
                  accept="image/*,video/*"
                  initialItems={galleryItems}
                  onItemsChange={setGalleryItems}
                />
              </Field>
            </div>

            <Field className="pt-4 border-t mt-4">
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 w-full">
                <Button
                  variant="outline"
                  asChild
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  <Link href="/dashboard/products">Regresar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
              <FormFeedback formState={formState} />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

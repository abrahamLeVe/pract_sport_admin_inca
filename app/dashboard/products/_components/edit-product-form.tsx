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
import { EditProductFormProps } from "@/validations/products";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";
import { ImageGalleryUploader } from "./image-gallery-uploader";

export function EditProductForm({
  initialData,
  categories,
  brands,
}: EditProductFormProps) {
  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: String(initialData.id),
      name: initialData.name || "",
      slug: initialData.slug || "",
      description: initialData.description || "",
      price: initialData.price || "",
      discount_price: initialData.discount_price || "",
      stock: initialData.stock || "0",
      category_id: String(initialData.category_id || ""),
      brand_id: String(initialData.brand_id || ""),
      status: initialData.status || "activo",
    },
  };

  const [formState, formAction, isPending] = useActionState(
    actions.products.updateProductAction,
    initialState,
  );
  const [name, setName] = useState(initialState.data.name);
  const [slug, setSlug] = useState(initialState.data.slug);
  const [description, setDescription] = useState(initialState.data.description);
  const [files, setFiles] = useState<File[]>([]);

  const initialImages =
    typeof initialData.images === "string"
      ? JSON.parse(initialData.images)
      : initialData.images || [];

  const [existingImages, setExistingImages] =
    useState<{ url: string; key: string }[]>(initialImages);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    setSlug(generateSlug(newName));
  };

  const handleAction = (formData: FormData) => {
    files.forEach((file) => formData.append("images", file));
    formData.append("existing_images", JSON.stringify(existingImages));
    startTransition(() => formAction(formData));
  };

  return (
    <Card>
      <CardContent>
        <form action={handleAction} className="p-6 md:p-8">
          <input type="hidden" name="id" value={initialData.id} />

          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center mb-4">
              <h1 className="text-2xl font-bold">Editar Producto</h1>
              <p className="text-sm text-balance text-muted-foreground">
                Actualiza la información del producto y modifica su galería de
                imágenes.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <Field>
                <FieldLabel htmlFor="gallery-upload">
                  Galería de Imágenes
                </FieldLabel>
                <ImageGalleryUploader
                  onFilesChange={setFiles}
                  initialImages={existingImages}
                  onExistingImagesChange={setExistingImages}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="name">Nombre del Producto</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Ej. Zapatillas Nike Air Max"
                    value={name}
                    onChange={handleNameChange}
                    disabled={isPending}
                    autoComplete="off"
                    required
                  />
                  <FormError error={formState.zodErrors?.name} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="slug">Slug (URL Amigable)</FieldLabel>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="Ej. zapatillas-nike-air-max"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field>
                  <FieldLabel htmlFor="price">Precio (S/)</FieldLabel>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="Ej. 199.90"
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
                    placeholder="Ej. 149.90"
                    defaultValue={formState.data?.discount_price ?? ""}
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.discount_price} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="stock">Stock Inicial</FieldLabel>
                  <Input
                    id="stock"
                    name="stock"
                    type="number"
                    placeholder="Ej. 50"
                    defaultValue={formState.data?.stock ?? ""}
                    disabled={isPending}
                    required
                  />
                  <FormError error={formState.zodErrors?.stock} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="category_id">Categoría</FieldLabel>
                  <Select
                    name="category_id"
                    defaultValue={formState.data?.category_id ?? ""}
                    disabled={isPending}
                    required
                  >
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder="Seleccionar categoría..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError error={formState.zodErrors?.category_id} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="brand_id">Marca</FieldLabel>
                  <Select
                    name="brand_id"
                    defaultValue={formState.data?.brand_id ?? ""}
                    disabled={isPending}
                    required
                  >
                    <SelectTrigger id="brand_id">
                      <SelectValue placeholder="Seleccionar marca..." />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormError error={formState.zodErrors?.brand_id} />
                </Field>
              </div>

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
                  <Link href="/dashboard/products">Cancelar</Link>
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto"
                >
                  {isPending ? "Guardando..." : "Guardar Cambios"}
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
  );
}

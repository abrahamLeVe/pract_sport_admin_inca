"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { SingleImageUploader } from "@/components/single-image-uploader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ClubSettings } from "@/validations/settings";
import { Trash } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

interface ClubSettingsFormProps {
  initialData: ClubSettings;
}

export function ClubSettingsForm({ initialData }: ClubSettingsFormProps) {
  const parsedLinks =
    typeof initialData.social_links === "string"
      ? JSON.parse(initialData.social_links || "{}")
      : initialData.social_links || {};

  const initialLinksArray = Object.entries(parsedLinks).map(
    ([platform, url]) => ({
      platform,
      url: url as string,
    }),
  );

  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: String(initialData.id || 1),
      name: initialData.name || "",
      primary_color: initialData.primary_color || "#000000",
      secondary_color: initialData.secondary_color || "#000000",
      description: initialData.description || "",
    } as Record<string, any>,
  };

  const [formState, formAction, isPending] = useActionState(
    actions.settings.updateClubSettingsAction,
    initialState,
  );

  const [savedFile, setSavedFile] = useState<File | null>(null);

  const [socialLinks, setSocialLinks] =
    useState<{ platform: string; url: string }[]>(initialLinksArray);

  const addSocialLink = () => {
    setSocialLinks([...socialLinks, { platform: "", url: "" }]);
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const updateSocialLink = (
    index: number,
    field: "platform" | "url",
    value: string,
  ) => {
    const newLinks = [...socialLinks];
    newLinks[index][field] = value;
    setSocialLinks(newLinks);
  };

  const handleAction = (formData: FormData) => {
    const currentFile = formData.get("logo") as File;
    if (savedFile && (!currentFile || currentFile.size === 0)) {
      formData.set("logo", savedFile);
    }
    formData.set("social_links", JSON.stringify(socialLinks));
    startTransition(() => formAction(formData));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8">
            <input type="hidden" name="id" value={initialData.id || 1} />

            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-4">
                <h1 className="text-2xl font-bold">Identidad del Club</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Personaliza la información, el logo, colores y las redes de la
                  web.
                </p>
              </div>

              <div className="flex flex-col gap-6">
                <Field>
                  <FieldLabel htmlFor="logo">Logo Oficial del Club</FieldLabel>
                  <p className="text-[13px] text-muted-foreground mb-2">
                    Tamaño mínimo recomendado: <b>800 x 800 px</b> (formato
                    cuadrado 1:1).
                  </p>

                  {/* 🔥 4. USAS EL COMPONENTE ASÍ DE FÁCIL 🔥 */}
                  <div className="w-48 mx-auto mt-2 mb-4">
                    <SingleImageUploader
                      id="logo"
                      initialImage={initialData.logo_url}
                      onFileSelect={setSavedFile}
                      aspectClass="aspect-square rounded-xl"
                      placeholderText="Cambiar logo"
                    />
                  </div>

                  <FormError error={formState.zodErrors?.logo} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="name">Nombre del Club</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={initialData.name || ""}
                    disabled={isPending}
                    autoComplete="name"
                    required
                  />
                  <FormError error={formState.zodErrors?.name} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="description">Descripción</FieldLabel>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={
                      formState.data?.description ??
                      initialData.description ??
                      ""
                    }
                    disabled={isPending}
                  />
                  <FormError error={formState.zodErrors?.description} />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="primary_color">
                      Color Primario
                    </FieldLabel>
                    <Input
                      id="primary_color"
                      type="color"
                      name="primary_color"
                      defaultValue={initialData.primary_color || "#000000"}
                      className="h-10 w-full p-1 cursor-pointer"
                      disabled={isPending}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="secondary_color">
                      Color Secundario
                    </FieldLabel>
                    <Input
                      id="secondary_color"
                      type="color"
                      name="secondary_color"
                      defaultValue={initialData.secondary_color || "#000000"}
                      className="h-10 w-full p-1 cursor-pointer"
                      disabled={isPending}
                    />
                  </Field>
                </div>

                <div className="pt-4 border-t mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Enlaces y Redes Sociales</h3>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSocialLink}
                      disabled={isPending}
                    >
                      + Añadir Enlace
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {socialLinks.map((link, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          id={`social-platform-${index}`}
                          name={`social_platform_${index}`}
                          placeholder="Ej. Facebook, Web..."
                          value={link.platform}
                          onChange={(e) =>
                            updateSocialLink(index, "platform", e.target.value)
                          }
                          disabled={isPending}
                          className="w-1/3"
                          required
                        />
                        <Input
                          id={`social-url-${index}`}
                          name={`social_url_${index}`}
                          placeholder="https://www.redsocial.com/grupo"
                          value={link.url}
                          type="url"
                          onChange={(e) =>
                            updateSocialLink(index, "url", e.target.value)
                          }
                          disabled={isPending}
                          className="flex-1"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSocialLink(index)}
                          disabled={isPending}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    {socialLinks.length === 0 && (
                      <p className="text-sm text-muted-foreground italic text-center py-4 border border-dashed rounded-md">
                        No hay enlaces configurados. Haz clic en "Añadir Enlace"
                        para empezar.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Field className="pt-4 border-t mt-4">
                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 w-full">
                  <Button
                    variant="outline"
                    asChild
                    disabled={isPending}
                    className="w-full sm:w-auto"
                  >
                    <Link href="/dashboard">Cancelar</Link>
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
                {formState.success && formState.message && (
                  <p className="text-green-600 text-sm text-right mt-3 font-medium">
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

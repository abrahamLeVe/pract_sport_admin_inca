"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ActionState } from "@/validations/core";
import { ProfileFormValues, UserProfileData } from "@/validations/profile";

import { SingleImageUploader } from "@/components/single-image-uploader";
import { Lock } from "lucide-react";
import Link from "next/link";
import { startTransition, useActionState, useState } from "react";

const formatDateForInput = (date: string | Date | null | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toISOString().split("T")[0];
};

interface ProfileFormProps {
  userId: number;
  initialData: UserProfileData & { image?: string | null };
  isOAuth: boolean; // 🔥 Prop nueva para saber si es usuario de Google
}

export function ProfileForm({
  userId,
  initialData,
  isOAuth,
}: ProfileFormProps) {
  const initialState: ActionState<ProfileFormValues> = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      name: initialData?.name || "",
      document_type: initialData?.document_type || "DNI",
      document_number: initialData?.document_number || "",
      phone: initialData?.phone || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      country: initialData?.country || "Perú",
      birth_date: formatDateForInput(initialData?.birth_date),
      gender: initialData?.gender || "",
      blood_type: initialData?.blood_type || "",
      tshirt_size: initialData?.tshirt_size || "",
      emergency_contact: initialData?.emergency_contact || "",
      emergency_phone: initialData?.emergency_phone || "",
    },
  };

  const [formState, formAction, isPending] = useActionState(
    actions.profile.updateProfileAction,
    initialState,
  );

  const [savedFile, setSavedFile] = useState<File | null>(null);

  const handleAction = (formData: FormData) => {
    const currentFile = formData.get("image") as File;
    if (savedFile && (!currentFile || currentFile.size === 0)) {
      formData.set("image", savedFile);
    }
    startTransition(() => formAction(formData));
  };

  // Generar iniciales para el Fallback
  const iniciales = initialData.name
    ? initialData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "US";

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardContent>
          <form action={handleAction} className="p-6 md:p-8">
            <input type="hidden" name="user_id" value={userId} />

            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center mb-6">
                <h1 className="text-2xl font-bold">Mi Cuenta</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Actualiza tu información personal y perfil deportivo.
                </p>
                <div className="relative group w-24 mx-auto mb-2 mt-4">
                  {isOAuth ? (
                    /* UI de usuario Google (bloqueada) */
                    <div className="relative">
                      <Avatar className="h-24 w-24 rounded-full border-4 border-background shadow-sm mx-auto">
                        <AvatarImage
                          src={initialData.image || undefined}
                          alt="Perfil"
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                          {iniciales}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 bg-muted text-muted-foreground p-1.5 rounded-full shadow-sm">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    /* UI de usuario normal usando el uploader reutilizable */
                    <SingleImageUploader
                      id="image"
                      initialImage={initialData.image} // Mantiene la foto actual si existe
                      onFileSelect={setSavedFile} // Almacena el nuevo archivo cuando el usuario cambia la foto
                      aspectClass="aspect-square rounded-full border-4 border-background shadow-sm"
                      placeholderText="Foto"
                      disabled={isPending}
                    />
                  )}
                </div>

                <p className="text-sm text-balance text-muted-foreground">
                  {isOAuth
                    ? "Tu foto de perfil está vinculada a tu cuenta de Google."
                    : "Actualiza tu foto personal y perfil deportivo."}
                </p>
              </div>

              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="personal">Datos Personales</TabsTrigger>
                  <TabsTrigger value="sports">Perfil Deportivo</TabsTrigger>
                </TabsList>

                {/* ---------------- TABS: DATOS PERSONALES ---------------- */}
                <TabsContent
                  value="personal"
                  forceMount
                  className="space-y-6 mt-0 data-[state=inactive]:hidden"
                >
                  <Field>
                    <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                    <Input
                      id="name"
                      name="name"
                      autoComplete="name"
                      defaultValue={String(formState.data?.name ?? "")}
                      placeholder="Ej. Abraham Leandro Vega"
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.name} />
                  </Field>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="document_type">
                        Tipo de Documento
                      </FieldLabel>
                      <Select
                        name="document_type"
                        defaultValue={String(
                          formState.data?.document_type ?? "DNI",
                        )}
                        disabled={isPending}
                      >
                        <SelectTrigger id="document_type">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DNI">DNI</SelectItem>
                          <SelectItem value="CE">
                            Carnet de Extranjería
                          </SelectItem>
                          <SelectItem value="PASSPORT">Pasaporte</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormError error={formState.zodErrors?.document_type} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="document_number">
                        Número de Documento
                      </FieldLabel>
                      <Input
                        id="document_number"
                        name="document_number"
                        autoComplete="document_number"
                        defaultValue={String(
                          formState.data?.document_number ?? "",
                        )}
                        placeholder="Ej. 70000001"
                        disabled={isPending}
                      />
                      <FormError error={formState.zodErrors?.document_number} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field>
                      <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                      <Input
                        id="phone"
                        name="phone"
                        autoComplete="phone"
                        defaultValue={String(formState.data?.phone ?? "")}
                        placeholder="Ej. 900000001"
                        disabled={isPending}
                      />
                      <FormError error={formState.zodErrors?.phone} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="city">Ciudad</FieldLabel>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={String(formState.data?.city ?? "")}
                        placeholder="Ej. Huancayo"
                        disabled={isPending}
                      />
                      <FormError error={formState.zodErrors?.city} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="country">País</FieldLabel>
                      <Input
                        id="country"
                        name="country"
                        autoComplete="country"
                        defaultValue={String(formState.data?.country ?? "Perú")}
                        disabled={isPending}
                      />
                      <FormError error={formState.zodErrors?.country} />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="address">
                      Dirección de Envío
                    </FieldLabel>
                    <Input
                      id="address"
                      name="address"
                      autoComplete="address"
                      defaultValue={String(formState.data?.address ?? "")}
                      placeholder="Ej. Av. Centenario 456"
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.address} />
                  </Field>
                </TabsContent>

                {/* ---------------- TABS: PERFIL DEPORTIVO ---------------- */}
                <TabsContent
                  value="sports"
                  forceMount
                  className="space-y-6 mt-0 data-[state=inactive]:hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="tshirt_size">
                        Talla de Polo
                      </FieldLabel>
                      <Select
                        name="tshirt_size"
                        defaultValue={String(formState.data?.tshirt_size ?? "")}
                        disabled={isPending}
                      >
                        <SelectTrigger id="tshirt_size">
                          <SelectValue placeholder="Selecciona tu talla" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="XS">XS</SelectItem>
                          <SelectItem value="S">S</SelectItem>
                          <SelectItem value="M">M</SelectItem>
                          <SelectItem value="L">L</SelectItem>
                          <SelectItem value="XL">XL</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormError error={formState.zodErrors?.tshirt_size} />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="blood_type">
                        Tipo de Sangre
                      </FieldLabel>
                      <Select
                        name="blood_type"
                        defaultValue={String(formState.data?.blood_type ?? "")}
                        disabled={isPending}
                      >
                        <SelectTrigger id="blood_type">
                          <SelectValue placeholder="Selecciona..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="O+">O+</SelectItem>
                          <SelectItem value="O-">O-</SelectItem>
                          <SelectItem value="A+">A+</SelectItem>
                          <SelectItem value="A-">A-</SelectItem>
                          <SelectItem value="B+">B+</SelectItem>
                          <SelectItem value="B-">B-</SelectItem>
                          <SelectItem value="AB+">AB+</SelectItem>
                          <SelectItem value="AB-">AB-</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormError error={formState.zodErrors?.blood_type} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field>
                      <FieldLabel htmlFor="emergency_contact">
                        Contacto de Emergencia
                      </FieldLabel>
                      <Input
                        id="emergency_contact"
                        name="emergency_contact"
                        defaultValue={String(
                          formState.data?.emergency_contact ?? "",
                        )}
                        placeholder="Nombre del familiar"
                        disabled={isPending}
                      />
                      <FormError
                        error={formState.zodErrors?.emergency_contact}
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="emergency_phone">
                        Teléfono de Emergencia
                      </FieldLabel>
                      <Input
                        id="emergency_phone"
                        name="emergency_phone"
                        defaultValue={String(
                          formState.data?.emergency_phone ?? "",
                        )}
                        placeholder="Ej. 900111222"
                        disabled={isPending}
                      />
                      <FormError error={formState.zodErrors?.emergency_phone} />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="birth_date">
                      Fecha de Nacimiento
                    </FieldLabel>
                    <Input
                      id="birth_date"
                      type="date"
                      name="birth_date"
                      defaultValue={String(formState.data?.birth_date ?? "")}
                      disabled={isPending}
                    />
                    <FormError error={formState.zodErrors?.birth_date} />
                  </Field>
                </TabsContent>

                {/* ---------------- BOTONES DE ACCIÓN ---------------- */}
                <Field className="md:col-span-2 pt-4 border-t mt-4">
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
                      className="w-full sm:w-auto"
                      disabled={isPending}
                    >
                      {isPending ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                  {!formState.success && formState.message && (
                    <p className="text-destructive text-sm text-right mt-2 font-medium">
                      {formState.message}
                    </p>
                  )}
                  {formState.success && formState.message && (
                    <p className="text-green-600 text-sm text-right mt-2 font-medium">
                      {formState.message}
                    </p>
                  )}
                </Field>
              </Tabs>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

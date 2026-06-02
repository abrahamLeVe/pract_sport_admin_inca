"use client";

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
import { cn } from "@/lib/utils";
import { useActionState } from "react";
import { FormError } from "../../../../components/form-error";
import { actions } from "@/app/actions";
import { EditUserFormProps } from "@/validations/auth";

export function EditUserForm({
  className,
  initialData,
  ...props
}: EditUserFormProps) {
  const initialState = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: String(initialData.id),
      name: initialData.name || "",
      email: initialData.email,
      role: initialData.role,
      status: initialData.status,
    } as Record<string, any>,
  };

  const [formState, formAction, isPending] = useActionState(
    actions.users.updateUserAction,
    initialState,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 w-full max-w-4xl mx-auto">
        <CardContent>
          <form action={formAction} className="p-6 md:p-8">
            <input type="hidden" name="id" value={initialData.id} />

            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Modificar Usuario</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Actualiza los privilegios, información básica o estado de la
                  cuenta.
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="name">Nombre Completo</FieldLabel>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Ej. Juan Pérez"
                  defaultValue={String(formState.data?.name ?? "")}
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.name} />
              </Field>

              <Field>
                <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="juan@ejemplo.com"
                  defaultValue={String(formState.data?.email ?? "")}
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.email} />
              </Field>

              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password">Nueva Contraseña</FieldLabel>
                  <span className="text-xs text-muted-foreground font-normal">
                    (Dejar en blanco para no cambiar)
                  </span>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="******"
                  disabled={isPending}
                />
                <FormError error={formState.zodErrors?.password} />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="role">Rol de Usuario</FieldLabel>
                  <Select
                    name="role"
                    defaultValue={String(formState.data?.role ?? "CLIENT")}
                    disabled={isPending}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SUPERADMIN">
                        Súper Administrador
                      </SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="CLIENT">Cliente (Web)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormError error={formState.zodErrors?.role} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="status">Estado de Cuenta</FieldLabel>
                  <Select
                    name="status"
                    defaultValue={String(formState.data?.status ?? "activo")}
                    disabled={isPending}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormError error={formState.zodErrors?.status} />
                </Field>
              </div>

              <Field className="pt-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Guardando cambios..." : "Guardar Cambios"}
                </Button>

                {!formState.success && formState.message && (
                  <p className="text-destructive text-sm text-center mt-2 font-medium">
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

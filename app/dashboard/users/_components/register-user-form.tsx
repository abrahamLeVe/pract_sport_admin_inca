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
import { FormState } from "@/validations/auth";

const INITIAL_STATE: FormState = {
  success: false,
  message: "",
  zodErrors: null,
  data: {
    name: "",
    email: "",
    password: "",
    role: "CLIENT",
  },
};

export function RegisterUserForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formState, formAction, isPending] = useActionState(
    actions.auth.registerUserAction,
    INITIAL_STATE,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 w-full max-w-4xl mx-auto">
        <CardContent>
          <form action={formAction} className="p-6 md:p-8">
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Registrar Nuevo Usuario</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Añade un nuevo administrador o cliente a la plataforma.
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
                  defaultValue={formState.data?.name ?? ""}
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
                  defaultValue={formState.data?.email ?? ""}
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.email} />
              </Field>

              <Field>
                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="******"
                  defaultValue={formState.data?.password ?? ""}
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.password} />
              </Field>

              <Field>
                <FieldLabel htmlFor="role">Rol de Usuario</FieldLabel>
                <Select
                  name="role"
                  defaultValue={formState.data?.role ?? "CLIENT"}
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

              <Field className="pt-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Creando usuario..." : "Registrar Usuario"}
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

"use client";

import { useActionState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";

import { loginAction } from "@/app/actions/auth";
import { FormLoginState } from "@/validations/auth";
import { FormError } from "./form-error";

// Definimos el estado inicial exacto para que calce con la acción
const INITIAL_LOGIN_STATE: FormLoginState = {
  success: false,
  message: "",
  zodErrors: null,
  data: {
    identifier: "",
    password: "",
  },
};

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [formState, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 w-full max-w-4xl mx-auto">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            action={formAction}
            className="p-6 md:p-8 flex flex-col justify-center"
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Bienvenido</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Ingresa tus credenciales para acceder a la plataforma.
                </p>
              </div>

              {/* CAMPO: IDENTIFICADOR (EMAIL O USERNAME) */}
              <Field>
                <FieldLabel htmlFor="identifier">Correo o Usuario</FieldLabel>
                <Input
                  id="identifier"
                  type="text"
                  name="identifier"
                  placeholder="Ej. juan@inkateam.com o juan12"
                  defaultValue={formState.data?.identifier ?? ""} // 👈 Compila perfectamente sin errores
                  disabled={isPending}
                  required
                />
                <FormError error={formState.zodErrors?.identifier} />
              </Field>

              {/* CAMPO: CONTRASEÑA */}
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

              {/* BOTÓN Y ALERTA GLOBAL */}
              <Field className="pt-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>

                {!formState.success && formState.message && (
                  <p className="text-destructive text-sm text-center mt-2 font-medium">
                    {formState.message}
                  </p>
                )}
              </Field>
            </FieldGroup>
          </form>

          <div className="relative hidden bg-muted md:block">
            <img
              src="/placeholder.png"
              alt="Inka Team"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

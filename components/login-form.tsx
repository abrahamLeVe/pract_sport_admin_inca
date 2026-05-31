"use client";

import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FormLoginState } from "@/validations/auth";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { FormError } from "./form-error";

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
  const searchParams = useSearchParams();
  const [formState, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );
  const sesionExpirada = searchParams.get("error") === "SessionExpired";
  console.log("sesionExpirada:", sesionExpirada);
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 w-full max-w-4xl mx-auto">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            action={formAction}
            className="p-6 md:p-8 flex flex-col justify-center"
          >
            {sesionExpirada && (
              <div className="mb-4 p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg font-medium text-center">
                ⚠️ Tu sesión ha expirado. Por favor, inicia sesión nuevamente.
              </div>
            )}
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Bienvenido</h1>
                <p className="text-sm text-balance text-muted-foreground">
                  Ingresa tus credenciales para acceder a la plataforma.
                </p>
              </div>

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

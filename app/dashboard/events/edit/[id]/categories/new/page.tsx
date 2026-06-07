"use client";

import { createEventCategoryAction } from "@/app/actions/event-categories";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { FormEventCategoryState } from "@/validations/event-categories";
import Link from "next/link";
import { startTransition, useActionState } from "react";

const INITIAL_STATE: FormEventCategoryState = {
  success: false,
  message: "",
  zodErrors: null,
  data: {},
};

export default function RegisterEventCategoryPage({
  params,
}: {
  params: { eventId: string };
}) {
  const eventId = Number(params.eventId);

  // Vinculamos la acción pasando el eventId como primer argumento
  const [formState, formAction, isPending] = useActionState(
    createEventCategoryAction.bind(null, eventId),
    INITIAL_STATE,
  );

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardContent>
          <form
            action={(formData) => startTransition(() => formAction(formData))}
            className="p-6"
          >
            <FieldGroup>
              <h1 className="text-2xl font-bold mb-6">Nueva Categoría</h1>

              <Field>
                <FieldLabel htmlFor="name">Nombre de la Categoría</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  placeholder="Ej. 21K Varones"
                  required
                />
                <FormError error={formState.zodErrors?.name} />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="min_age">Edad Mínima</FieldLabel>
                  <Input
                    id="min_age"
                    name="min_age"
                    type="number"
                    placeholder="Ej. 18"
                  />
                  <FormError error={formState.zodErrors?.min_age} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="max_age">Edad Máxima</FieldLabel>
                  <Input
                    id="max_age"
                    name="max_age"
                    type="number"
                    placeholder="Ej. 99"
                  />
                  <FormError error={formState.zodErrors?.max_age} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="price">Precio (S/)</FieldLabel>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                  <FormError error={formState.zodErrors?.price} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cupos">Cupos Disponibles</FieldLabel>
                  <Input
                    id="cupos"
                    name="cupos"
                    type="number"
                    placeholder="Ej. 100"
                    required
                  />
                  <FormError error={formState.zodErrors?.cupos} />
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" asChild>
                  <Link href={`/dashboard/events/edit/${eventId}`}>
                    Cancelar
                  </Link>
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? "Guardando..." : "Crear Categoría"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

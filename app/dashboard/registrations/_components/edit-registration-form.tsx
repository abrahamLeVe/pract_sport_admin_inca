"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ActionState } from "@/validations/core";
import {
  EventRegistration,
  UpdateRegistrationStatusInput,
} from "@/validations/registrations";
import { CheckCircle, CreditCard, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";

interface EditRegistrationFormProps {
  initialData: EventRegistration;
  nextAvailableBib: number;
}

export function EditRegistrationForm({
  initialData,
  nextAvailableBib,
}: EditRegistrationFormProps) {
  const initialState: ActionState<UpdateRegistrationStatusInput> = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: initialData.id,
      bib_number: initialData.bib_number,
      registration_status: initialData.registration_status,
      payment_status: initialData.payment_status,
    },
  };
  const [bib, setBib] = useState<string | number>(initialData.bib_number || "");
  const [formState, formAction, isPending] = useActionState(
    actions.registrations.updateRegistrationStatusAction,
    initialState,
  );

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "S/ 0.00";
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  // Extraemos los detalles del JSONB para mayor comodidad
  const details = initialData.participant_details;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMNA IZQUIERDA: Detalles del Atleta y Evento */}
      <div className="lg:col-span-2 space-y-6">
        {/* Información del Atleta */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Datos del Participante</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">
                {details.firstName} {details.lastName}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">
                {details.documentType || "Documento"}
              </p>
              <p className="font-medium">{details.documentNumber}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Correo Electrónico</p>
              <p className="font-medium">{details.email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-medium">{details.phone}</p>
            </div>
            {details.tshirtSize && (
              <div>
                <p className="text-muted-foreground">Talla de Polo</p>
                <Badge variant="outline">{details.tshirtSize}</Badge>
              </div>
            )}
            {details.bloodType && (
              <div>
                <p className="text-muted-foreground">Tipo de Sangre</p>
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                >
                  {details.bloodType}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Evento */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CheckCircle className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Inscripción al Evento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground">Evento</p>
              <p className="font-medium text-lg">{initialData.event_title}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Categoría Seleccionada</p>
              <p className="font-medium">{initialData.category_name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Detalles del Pago */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <CreditCard className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Evidencia de Pago</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Método de Pago</p>
              <p className="font-medium capitalize">
                {initialData.payment_method || "No registrado"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Monto Declarado</p>
              <p className="font-medium">
                {formatCurrency(initialData.payment_amount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">N° de Operación</p>
              <p className="font-medium">
                {initialData.operation_number || "N/A"}
              </p>
            </div>
            {initialData.payment_receipt_url && (
              <div className="pt-2">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={initialData.payment_receipt_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Ver comprobante de pago
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* COLUMNA DERECHA: Formulario de Control y Aprobación */}
      <div className="space-y-6">
        <Card className="sticky top-14">
          <CardHeader>
            <CardTitle>Panel de Aprobación</CardTitle>
            <CardDescription>
              Valida el pago y asigna el dorsal oficial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="id" value={initialData.id} />

              <div className="space-y-3">
                <Label htmlFor="payment_status">Estado del Pago</Label>
                <Select
                  name="payment_status"
                  defaultValue={initialData.payment_status}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="order_status"
                    className="w-full bg-background"
                  >
                    <SelectValue placeholder="Seleccionar pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">🔴 No Pagado</SelectItem>
                    <SelectItem value="paid">🟢 Pagado (Aprobado)</SelectItem>
                    <SelectItem value="failed">
                      ⚫ Fallido / Rechazado
                    </SelectItem>
                    <SelectItem value="refunded">🟣 Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
                <FormError error={formState.zodErrors?.payment_status} />
              </div>

              <div className="space-y-3">
                <Label htmlFor="registration_status">
                  Estado de Inscripción
                </Label>
                <Select
                  name="registration_status"
                  defaultValue={initialData.registration_status}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="order_status"
                    className="w-full bg-background"
                  >
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      🟡 Pendiente de Revisión
                    </SelectItem>
                    <SelectItem value="approved">
                      🟢 Aprobado (Corredor Oficial)
                    </SelectItem>
                    <SelectItem value="cancelled">🔴 Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormError error={formState.zodErrors?.registration_status} />
              </div>

              <div className="space-y-3">
                <Label htmlFor="bib_number">Número de Dorsal (BIB)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    id="bib_number"
                    name="bib_number"
                    placeholder="Ej: 101"
                    value={bib}
                    onChange={(e) => setBib(e.target.value)}
                    disabled={isPending}
                    className="bg-background"
                  />

                  {/* BOTÓN SUGERENCIA: Solo aparece si nunca tuvo dorsal y el campo está vacío */}
                  {!initialData.bib_number && !bib && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setBib(nextAvailableBib)}
                      disabled={isPending}
                    >
                      Asignar #{nextAvailableBib}
                    </Button>
                  )}

                  {/* 🔥 BOTÓN SALVAVIDAS: Aparece si borró o modificó el dorsal que ya tenía asignado */}
                  {initialData.bib_number && bib != initialData.bib_number && (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                      onClick={() => setBib(initialData.bib_number!)}
                      disabled={isPending}
                    >
                      Restaurar #{initialData.bib_number}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Déjalo en blanco si el número se asignará el día del evento.
                </p>
                <FormError error={formState.zodErrors?.bib_number} />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Inscripción"}
                </Button>

                {formState.success && (
                  <p className="text-sm text-green-600 font-medium text-center mt-2">
                    {formState.message}
                  </p>
                )}
                {!formState.success && formState.message && (
                  <p className="text-sm text-destructive font-medium text-center mt-2">
                    {formState.message}
                  </p>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/dashboard/registrations">
                    Volver a inscripciones
                  </Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

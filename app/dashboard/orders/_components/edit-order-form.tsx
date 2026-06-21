"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ActionState } from "@/validations/core";
import { Order, UpdateOrderStatusInput } from "@/validations/orders";
import { Package, Truck, User } from "lucide-react";
import { useActionState } from "react";

interface EditOrderFormProps {
  initialData: Order;
}

export function EditOrderForm({ initialData }: EditOrderFormProps) {
  const initialState: ActionState<UpdateOrderStatusInput> = {
    success: false,
    message: "",
    zodErrors: null,
    data: {
      id: initialData.id,
      order_status: initialData.order_status,
      payment_status: initialData.payment_status,
      notes: initialData.notes || "",
    },
  };

  const [formState, formAction, isPending] = useActionState(
    actions.orders.updateOrderStatusAction,
    initialState,
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* COLUMNA IZQUIERDA: Detalles del Pedido y Cliente */}
      <div className="lg:col-span-2 space-y-6">
        {/* Productos Comprados */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Package className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Productos en el Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialData.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">
                      {formatCurrency(item.subtotal)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unit_price)} c/u
                    </p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="font-bold">Total del Pedido</p>
                <p className="font-bold text-lg">
                  {formatCurrency(initialData.total_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Cliente */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nombre Completo</p>
              <p className="font-medium">{initialData.customer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Documento (DNI/CE)</p>
              <p className="font-medium">
                {initialData.customer_dni || "No registrado"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Correo Electrónico</p>
              <p className="font-medium">{initialData.customer_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Teléfono</p>
              <p className="font-medium">{initialData.customer_phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* Dirección de Envío */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <Truck className="w-5 h-5 text-muted-foreground" />
            <CardTitle>Dirección de Entrega</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p className="font-medium">{initialData.shipping_address}</p>
            {initialData.shipping_city && <p>{initialData.shipping_city}</p>}
            {initialData.shipping_postal_code && (
              <p>CP: {initialData.shipping_postal_code}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* COLUMNA DERECHA: Formulario de Actualización */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Gestión del Pedido</CardTitle>
            <CardDescription>
              Actualiza el estado logístico y de pago.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="space-y-6">
              <input type="hidden" name="id" value={initialData.id} />

              <div className="space-y-3">
                <Label htmlFor="order_status">Estado del Envío</Label>
                <Select
                  name="order_status"
                  defaultValue={initialData.order_status}
                  disabled={isPending}
                >
                  <SelectTrigger id="order_status">
                    <SelectValue placeholder="Seleccionar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuevo">🔴 Nuevo (Recibido)</SelectItem>
                    <SelectItem value="procesando">
                      🟡 Procesando (Preparando)
                    </SelectItem>
                    <SelectItem value="enviado">
                      🟣 Enviado (En camino)
                    </SelectItem>
                    <SelectItem value="entregado">🟢 Entregado</SelectItem>
                    <SelectItem value="cancelado">⚫ Cancelado</SelectItem>
                  </SelectContent>
                </Select>
                <FormError error={formState.zodErrors?.order_status} />
              </div>

              <div className="space-y-3">
                <Label htmlFor="payment_status">Estado del Pago</Label>
                <Select
                  name="payment_status"
                  defaultValue={initialData.payment_status}
                  disabled={isPending}
                >
                  <SelectTrigger id="payment_status">
                    <SelectValue placeholder="Seleccionar pago" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">🟡 Pendiente</SelectItem>
                    <SelectItem value="pagado">🟢 Pagado</SelectItem>
                    <SelectItem value="fallido">🔴 Fallido</SelectItem>
                    <SelectItem value="reembolsado">⚫ Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
                <FormError error={formState.zodErrors?.payment_status} />
              </div>

              <div className="space-y-3">
                <Label htmlFor="notes">Notas Internas (Opcional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Ej: Cliente pidió dejar en recepción..."
                  defaultValue={initialData.notes || ""}
                  disabled={isPending}
                  className="resize-none"
                />
                <FormError error={formState.zodErrors?.notes} />
              </div>

              <Separator />

              <div className="flex flex-col gap-2">
                <Button type="submit" className="w-full" disabled={isPending}>
                  {isPending ? "Guardando..." : "Guardar Cambios"}
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
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

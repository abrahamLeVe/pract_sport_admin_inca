"use client";

import { actions } from "@/app/actions";
import { FormError } from "@/components/form-error";
import { RichTextEditor } from "@/components/rich-text-editor";
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
import { ActionState } from "@/validations/core";
import { Order, UpdateOrderStatusInput } from "@/validations/orders";
import { CreditCard, Package, Truck, User } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";

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
  const [description, setDescription] = useState(initialData.notes || "");
  // Muestra notificaciones al guardar
  useEffect(() => {
    if (!formState.message) return;
    if (formState.success) {
      toast.success(formState.message);
    } else {
      toast.error(formState.message);
    }
  }, [formState]);

  // 🔥 Formateador seguro (soporta string de la BD o number)
  const formatCurrency = (amount: number | string) => {
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(numericAmount || 0);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ========================================================= */}
      {/* COLUMNA IZQUIERDA: Detalles del Pedido y Cliente            */}
      {/* ========================================================= */}
      <div className="lg:col-span-2 space-y-6">
        {/* Productos Comprados */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <Package className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Productos en el Pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {initialData.items && initialData.items.length > 0 ? (
                initialData.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.product_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.variant_details
                          ? item.variant_details
                          : "Talla Única"}{" "}
                        • Cantidad: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {formatCurrency(item.subtotal)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatCurrency(item.unit_price)} c/u
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No se encontraron productos para esta orden.
                </p>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <p className="font-bold text-muted-foreground">
                  Total del Pedido
                </p>
                <p className="font-bold text-xl tracking-tight">
                  {formatCurrency(initialData.total_amount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Cliente */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-4">
            <User className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-lg">Información del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Nombre Completo</p>
              <p className="font-medium">{initialData.customer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Documento (DNI/CE)</p>
              <p className="font-medium">
                {initialData.customer_dni || "No registrado"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Correo Electrónico</p>
              <p className="font-medium">{initialData.customer_email}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Teléfono</p>
              <p className="font-medium">{initialData.customer_phone}</p>
            </div>
          </CardContent>
        </Card>

        {/* CONTENEDOR INFERIOR: Envío y Finanzas (Grid de 2 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dirección de Envío */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <Truck className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Dirección de Entrega</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <p className="font-medium">
                {initialData.shipping_address || "No especificada"}
              </p>
              {initialData.shipping_city && (
                <p className="text-muted-foreground">
                  {initialData.shipping_city}
                </p>
              )}
              {initialData.shipping_postal_code && (
                <p className="text-muted-foreground">
                  CP: {initialData.shipping_postal_code}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-4">
              <CreditCard className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-lg">Información Financiera</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground mb-1">Método de Pago</p>
                  <p className="font-medium capitalize">
                    {initialData.payment_method || "No registrado"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Monto Cobrado</p>
                  <p className="font-medium">
                    {formatCurrency(initialData.total_amount)}
                  </p>
                </div>
              </div>

              {/* 🔥 AHORA SÍ MOSTRAMOS LOS DETALLES VITALES */}
              <div>
                <p className="text-muted-foreground mb-1">N° de Operación</p>
                <p className="font-medium">
                  {initialData.operation_number || "N/A"}
                </p>
              </div>
              {initialData.payment_receipt_url && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full"
                  >
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
      </div>

      {/* ========================================================= */}
      {/* COLUMNA DERECHA: Formulario de Actualización                */}
      {/* ========================================================= */}
      <div className="space-y-6">
        <Card className="sticky top-14">
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
                <Label htmlFor="order_status" className="text-sm font-medium">
                  Estado del Envío
                </Label>
                <Select
                  name="order_status"
                  defaultValue={initialData.order_status}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="order_status"
                    className="w-full bg-background"
                  >
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
                <Label htmlFor="payment_status" className="text-sm font-medium">
                  Estado del Pago
                </Label>
                <Select
                  name="payment_status"
                  defaultValue={initialData.payment_status}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="payment_status"
                    className="w-full bg-background"
                  >
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
                <div className="text-sm font-medium leading-none mb-4">
                  Notas Internas (Opcional)
                </div>
                <input type="hidden" name="notes" value={description} />
                <RichTextEditor
                  value={description}
                  disabled={isPending}
                  onChange={setDescription}
                />
                <FormError error={formState.zodErrors?.notes} />
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
                  <Link href="/dashboard/orders">Volver a pedidos</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

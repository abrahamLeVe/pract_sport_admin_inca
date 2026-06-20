import { z } from "zod";

// ============================================================================
// 1. ESQUEMAS DE VALIDACIÓN (Para el Admin Panel)
// ============================================================================

// Esquema para cuando el administrador quiera cambiar el estado de un pedido
export const updateOrderStatusSchema = z.object({
  id: z.coerce.number(),
  order_status: z.enum([
    "nuevo",
    "procesando",
    "enviado",
    "entregado",
    "cancelado",
  ]),
  payment_status: z
    .enum(["pendiente", "pagado", "fallido", "reembolsado"])
    .optional(),
  notes: z.string().optional(),
});

// ============================================================================
// 2. TIPOS INFERIDOS (Para TypeScript)
// ============================================================================

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// Tipo para representar un Item del Pedido (Lo que leeremos de la BD)
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

// Tipo para representar el Pedido Completo (Lo que mostraremos en la tabla)
export interface Order {
  id: number;
  order_number: string;
  user_id: number | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_dni: string | null;
  shipping_address: string;
  shipping_city: string | null;
  shipping_postal_code: string | null; // 🔥 ESTA ES LA LÍNEA QUE FALTABA
  total_amount: number;
  payment_method: string | null;
  payment_status: "pendiente" | "pagado" | "fallido" | "reembolsado";
  order_status: "nuevo" | "procesando" | "enviado" | "entregado" | "cancelado";
  notes: string | null;
  created_at: Date;
  updated_at: Date;

  // Relación con los items
  items?: OrderItem[];
}

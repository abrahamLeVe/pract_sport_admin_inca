import { z } from "zod";

// 1. Esquema para la actualización de estados (lo que usa el Server Action)
export const updateOrderStatusSchema = z.object({
  id: z.union([z.string(), z.number()]),
  order_status: z.string().min(1, "El estado de envío es requerido"),
  payment_status: z.string().min(1, "El estado de pago es requerido"),
  notes: z.string().optional().nullable(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

// ============================================================================
// 2. INTERFACES ESTRICTAS PARA LA BASE DE DATOS Y COMPONENTES
// ============================================================================

// Interfaz para cada producto dentro de la orden
export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id?: number | null;
  quantity: number;
  unit_price: number | string; // Postgres devuelve decimales como strings
  subtotal: number | string;
  product_name: string;
  variant_details?: string | null;
}

// Interfaz para la Orden Completa
export interface Order {
  id: number;
  order_number: string;
  customer_id?: number | null;
  customer_name: string;
  customer_email: string;
  customer_dni?: string | null;
  customer_phone?: string | null;
  shipping_address?: string | null;
  shipping_city?: string | null;
  shipping_postal_code?: string | null;
  total_amount: number | string;
  order_status: string;
  payment_status: string;
  payment_method?: string | null;
  notes?: string | null;
  operation_number?: string | null;
  payment_receipt_url?: string | null;
  created_at: Date | string;
  updated_at?: Date | string | null;
  // 🔥 Anidamos los items estrictamente tipados
  items?: OrderItem[];
}

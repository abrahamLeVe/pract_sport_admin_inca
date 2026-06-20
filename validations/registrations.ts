import { z } from "zod";

// ============================================================================
// 1. ESQUEMAS DE VALIDACIÓN (Para el Panel de Administrador)
// ============================================================================

// Esquema para validar un pago y asignar el número de competidor
export const updateRegistrationStatusSchema = z.object({
  id: z.coerce.number(),
  bib_number: z.coerce.number().nullable().optional(), // El número de dorsal (BIB)
  registration_status: z.enum(["pending", "approved", "cancelled"]),
  payment_status: z.enum(["unpaid", "paid", "failed", "refunded"]),
});

// ============================================================================
// 2. TIPOS INFERIDOS (Para TypeScript)
// ============================================================================

export type UpdateRegistrationStatusInput = z.infer<
  typeof updateRegistrationStatusSchema
>;

// Interfaz para representar la inscripción combinada con datos del evento
export interface EventRegistration {
  id: number;
  event_id: number;
  category_id: number;
  user_id: number | null;

  // El JSONB con las respuestas del formulario del atleta
  participant_details: {
    firstName: string;
    lastName: string;
    documentType: string;
    documentNumber: string;
    email: string;
    phone: string;
    bloodType?: string;
    tshirtSize?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
    [key: string]: any; // Permite campos extra
  };

  bib_number: number | null;
  registration_status: "pending" | "approved" | "cancelled";
  payment_status: "unpaid" | "paid" | "failed" | "refunded";
  payment_method: string | null;
  payment_receipt_url: string | null;
  operation_number: string | null;
  payment_amount: number | null;
  voucher_date: Date | null;
  payment_verified_at: Date | null;
  created_at: Date;

  // 🔥 CAMPOS VIRTUALES (Los traeremos con JOINs desde SQL para la tabla)
  event_title?: string;
  category_name?: string;
}

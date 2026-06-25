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

// Colores para los estados de inscripción
export const registrationColors: Record<string, string> = {
  pending: "bg-yellow-500 hover:bg-yellow-600 text-white",
  approved: "bg-green-500 hover:bg-green-600 text-white",
  cancelled: "bg-red-500 hover:bg-red-600 text-white",
};

// Colores para los estados de pago
export const paymentColors: Record<string, string> = {
  unpaid: "bg-red-500/20 text-red-700 hover:bg-red-500/30 border-red-200",
  pending:
    "bg-yellow-500/20 text-yellow-700 hover:bg-yellow-500/30 border-yellow-200",
  paid: "bg-green-500/20 text-green-700 hover:bg-green-500/30 border-green-200",
  failed: "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 border-gray-200",
  refunded: "bg-gray-500/20 text-gray-700 hover:bg-gray-500/30 border-gray-200",
};

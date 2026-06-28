import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  document_type: z
    .string()
    .min(1, { message: "Selecciona un tipo de documento." }),
  document_number: z
    .string()
    .min(6, { message: "Número de documento inválido." }),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  country: z.string().default("Perú"),

  // Datos Deportivos y Médicos
  birth_date: z.string().optional().or(z.literal("")),
  gender: z.string().optional().or(z.literal("")),
  blood_type: z.string().optional().or(z.literal("")),
  tshirt_size: z.string().optional().or(z.literal("")),
  emergency_contact: z.string().optional().or(z.literal("")),
  emergency_phone: z.string().optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export interface UserProfileData {
  name?: string;
  document_type?: string;
  document_number?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  birth_date?: string | Date;
  gender?: string;
  blood_type?: string;
  tshirt_size?: string;
  emergency_contact?: string;
  emergency_phone?: string;
}

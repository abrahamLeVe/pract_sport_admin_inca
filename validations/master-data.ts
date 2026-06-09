import { z } from "zod";

// ============================================================================
// 1. DISTANCIAS (Master Distances)
// ============================================================================
export const distanceSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la distancia es obligatorio (ej. 21K)."),
});

export const editDistanceSchema = distanceSchema.extend({
  id: z.coerce.number(),
});

export interface FormDistanceState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditDistanceFormProps {
  initialData: {
    id: number;
    name: string;
  };
}

// ============================================================================
// 2. GÉNEROS (Master Genders)
// ============================================================================
export const genderSchema = z.object({
  name: z.string().min(2, "El nombre del género es obligatorio."),
});

export const editGenderSchema = genderSchema.extend({
  id: z.coerce.number(),
});

export interface FormGenderState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditGenderFormProps {
  initialData: {
    id: number;
    name: string;
  };
}

// ============================================================================
// 3. CATEGORÍAS DE EDAD (Master Age Categories)
// ============================================================================
export const ageCategorySchema = z
  .object({
    name: z.string().min(2, "El nombre de la categoría es obligatorio."),
    // Cambiamos 'invalid_type_error' por 'message'
    default_min_age: z.coerce
      .number({ message: "Debe ser un número" })
      .min(0, "La edad no puede ser negativa."),
    default_max_age: z.coerce
      .number({ message: "Debe ser un número" })
      .min(0, "La edad no puede ser negativa."),
  })
  // VALIDACIÓN INTELIGENTE: Verifica que la edad máxima sea mayor a la mínima
  .refine((data) => data.default_max_age >= data.default_min_age, {
    message: "La edad máxima debe ser mayor o igual a la mínima.",
    path: ["default_max_age"],
  });

export const editAgeCategorySchema = ageCategorySchema.extend({
  id: z.coerce.number(),
});

export interface FormAgeCategoryState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditAgeCategoryFormProps {
  initialData: {
    id: number;
    name: string;
    default_min_age: number;
    default_max_age: number;
  };
}

// ============================================================================
// 2. TIPOS DE EVENTO (Master Event Types)
// ============================================================================
export const eventTypeSchema = z.object({
  name: z.string().min(2, "El nombre del tipo de evento es obligatorio."),
});

export const editEventTypeSchema = eventTypeSchema.extend({
  id: z.coerce.number(),
});

export interface FormEventTypeState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditEventTypeFormProps {
  initialData: {
    id: number;
    name: string;
  };
}

export type Gender = z.infer<typeof editGenderSchema>;
export type AgeCategory = z.infer<typeof editAgeCategorySchema>;
export type Distance = z.infer<typeof editDistanceSchema>;
export type EventType = z.infer<typeof editEventTypeSchema>;

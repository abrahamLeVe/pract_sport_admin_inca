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

export type DistanceInput = z.infer<typeof distanceSchema>;
export type EditDistanceInput = z.infer<typeof editDistanceSchema>;

export interface EditDistanceFormProps {
  initialData: EditDistanceInput; // 🔥 Zod infiere los campos automáticamente
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

export type GenderInput = z.infer<typeof genderSchema>;
export type EditGenderInput = z.infer<typeof editGenderSchema>;

export interface EditGenderFormProps {
  initialData: EditGenderInput;
}

// ============================================================================
// 3. CATEGORÍAS DE EDAD (Master Age Categories)
// ============================================================================
export const ageCategorySchema = z
  .object({
    name: z.string().min(2, "El nombre de la categoría es obligatorio."),
    default_min_age: z.coerce
      .number({ message: "Debe ser un número" })
      .min(0, "La edad no puede ser negativa."),
    default_max_age: z.coerce
      .number({ message: "Debe ser un número" })
      .min(0, "La edad no puede ser negativa."),
  })
  .refine((data) => data.default_max_age >= data.default_min_age, {
    message: "La edad máxima debe ser mayor o igual a la mínima.",
    path: ["default_max_age"],
  });

export const editAgeCategorySchema = ageCategorySchema.extend({
  id: z.coerce.number(),
});

export type AgeCategoryInput = z.infer<typeof ageCategorySchema>;
export type EditAgeCategoryInput = z.infer<typeof editAgeCategorySchema>;

export interface EditAgeCategoryFormProps {
  initialData: EditAgeCategoryInput;
}

// ============================================================================
// 4. TIPOS DE EVENTO (Master Event Types)
// ============================================================================
export const eventTypeSchema = z.object({
  name: z.string().min(2, "El nombre del tipo de evento es obligatorio."),
});

export const editEventTypeSchema = eventTypeSchema.extend({
  id: z.coerce.number(),
});

export type EventTypeInput = z.infer<typeof eventTypeSchema>;
export type EditEventTypeInput = z.infer<typeof editEventTypeSchema>;

export interface EditEventTypeFormProps {
  initialData: EditEventTypeInput;
}

import { z } from "zod";

// ============================================================================
// 1. ESQUEMA DE CATEGORÍAS (Fuente única para crear, editar y listar)
// ============================================================================
export const eventCategorySchema = z
  .object({
    distance_id: z.coerce.number().min(1, "Selecciona una distancia."),
    gender_id: z.coerce.number().min(1, "Selecciona un género."),
    age_category_id: z.coerce
      .number()
      .min(1, "Selecciona una categoría de edad."),
    applied_min_age: z.coerce
      .number()
      .min(0, "La edad mínima no puede ser negativa."),
    applied_max_age: z.coerce
      .number()
      .min(0, "La edad máxima no puede ser negativa."),
    price: z.coerce.number().min(0, "El precio no puede ser negativo."),
    cupos: z.coerce.number().min(0, "Los cupos no pueden ser negativos."),
  })
  .refine((data) => data.applied_max_age >= data.applied_min_age, {
    message: "La edad máxima debe ser mayor o igual a la mínima.",
    path: ["applied_max_age"],
  });

// Esquema de extensión para cuando manipulamos una categoría individual ya existente
export const editEventCategorySchema = eventCategorySchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 2. ESQUEMA PRINCIPAL DEL EVENTO
// ============================================================================
export const eventSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  event_date: z.coerce.date({
    message: "La fecha del evento es obligatoria o el formato es inválido.",
  }),
  location_name: z.string().min(2, "La ubicación es obligatoria."),
  latitude: z.coerce.number().optional().nullable(),
  longitude: z.coerce.number().optional().nullable(),
  event_type_id: z.coerce.number().min(1, "Selecciona un tipo de evento."),
  status: z
    .enum(["draft", "published", "completed", "cancelled"])
    .default("draft"),
  categories: z
    .array(eventCategorySchema)
    .min(1, "Debes agregar al menos una categoría al evento."),
});

export const editEventSchema = eventSchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 3. INTERFACES DE ESTADOS PARA ACCIONES (Form States)
// ============================================================================
export interface FormEventState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

// ============================================================================
// 4. TIPOS RIGUROSOS PARA PROPS E INTERFACES DE TABLAS (Adiós a los any)
// ============================================================================

// Tipo inferido básico de la categoría
export type EventCategoryFormData = z.infer<typeof eventCategorySchema>;

// 🔥 EL TIPO MAESTRO: Representa exactamente una fila de categoría devuelta por tus SQL JOINS
export interface EventCategoryRow {
  id: number;
  event_id: number;
  distance_id: number;
  distance_name: string; // Viene del LEFT JOIN md.name
  gender_id: number;
  gender_name: string; // Viene del LEFT JOIN mg.name
  age_category_id: number;
  age_category_name: string; // Viene del LEFT JOIN mac.name
  applied_min_age: number;
  applied_max_age: number;
  price: number;
  cupos: number;
  registered_count: number; // Viene del contador de inscritos
}

// Tipos estructurales para los datos maestros auxiliares de las tablas
export interface MasterDataGrid {
  id: number;
  name: string;
}
export interface MasterAgeCategoryGrid {
  id: number;
  name: string;
  default_min_age: number;
  default_max_age: number;
}

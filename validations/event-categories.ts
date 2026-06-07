import { z } from "zod";

export const eventCategorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  min_age: z.coerce.number().int().nonnegative().optional(),
  max_age: z.coerce.number().int().positive().optional(),
  price: z.coerce.number().nonnegative("El precio no puede ser negativo."),
  cupos: z.coerce.number().int().positive("Los cupos deben ser al menos 1."),
});

export const editEventCategorySchema = eventCategorySchema.extend({
  id: z.coerce.number(),
});

export interface FormEventCategoryState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditEventCategoryFormProps {
  initialData: EventCategory;
}

export interface EventCategory {
  id: number;
  event_id: number;
  name: string;
  min_age: number | null;
  max_age: number | null;
  price: number | string;
  cupos: number;
}

export interface EventCategoriesTableProps {
  categories: EventCategory[];
  eventId: number;
}

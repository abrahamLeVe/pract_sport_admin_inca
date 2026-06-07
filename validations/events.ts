import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  description: z.string().optional(),
  event_date: z.coerce.date({
    message: "La fecha del evento es obligatoria o el formato es inválido.",
  }),
  location: z.string().min(2, "La ubicación es obligatoria."),
  event_type: z.enum(["running", "triatlon", "duatlon", "trail", "marathon"], {
    message: "Selecciona un tipo de evento válido.",
  }),
  distances: z.string().optional(),
  max_participants: z.coerce
    .number()
    .positive("Debe ser un número mayor a 0.")
    .optional(),
  status: z
    .enum(["draft", "published", "completed", "cancelled"])
    .default("draft"),
});

// Extendemos el esquema principal para exigir el ID al editar (Igual que en categorías)
export const editEventSchema = eventSchema.extend({
  id: z.coerce.number(),
});

export interface FormEventState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

// Interfaz explícita para los datos iniciales del formulario de edición
export interface EditEventFormProps {
  initialData: {
    id: number;
    title: string;
    description: string | null;
    event_date: Date | string; // Aceptamos string porque Next.js serializa las fechas al pasar de Server a Client Component
    location: string;
    event_type: string;
    distances: string | null;
    max_participants: number | null;
    image_url: string | null;
    image_key: string | null;
    status: string;
  };
}

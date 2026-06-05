import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  // Regex para asegurar que el slug sea amigable para URLs (ej: zapatillas-running)
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "El slug solo puede contener minúsculas, números y guiones (sin espacios).",
    ),
  description: z.string().optional(),
  status: z.enum(["activo", "inactivo"]).default("activo"),
});

export const editCategorySchema = categorySchema.extend({
  id: z.coerce.number(),
});

export interface FormCategoryState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditCategoryFormProps {
  initialData: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    status: string;
  };
}

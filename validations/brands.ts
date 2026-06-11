import { z } from "zod";

export const brandSchema = z.object({
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

export const editBrandSchema = brandSchema.extend({
  id: z.coerce.number(),
});

export interface FormBrandState {
  success: boolean;
  message?: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface EditBrandFormProps {
  initialData: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    image_url: string | null;
    status: string;
  };
}

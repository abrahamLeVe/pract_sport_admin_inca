import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
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

export type CategoryInput = z.infer<typeof categorySchema>;
export type EditCategoryInput = z.infer<typeof editCategorySchema>;

export interface EditCategoryFormProps {
  initialData: EditCategoryInput & {
    image_url: string;
  };
}

// ============================================================================
// 3. INTERFAZ PARA LA TABLA
// ============================================================================
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  image_key: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;

  // 🔥 Campo virtual para la DataTable
  is_active?: boolean;
}

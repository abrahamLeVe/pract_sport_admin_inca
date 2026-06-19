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

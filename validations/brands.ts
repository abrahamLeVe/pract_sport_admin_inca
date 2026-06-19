import { z } from "zod";

export const brandSchema = z.object({
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

export const editBrandSchema = brandSchema.extend({
  id: z.coerce.number(),
});

export type BrandInput = z.infer<typeof brandSchema>;
export type EditBrandInput = z.infer<typeof editBrandSchema>;

export interface EditBrandFormProps {
  initialData: EditBrandInput & {
    image_url: string;
  };
}

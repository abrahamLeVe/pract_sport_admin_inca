import { z } from "zod";

const baseVariantSchema = z.object({
  product_id: z.coerce.number().int("ID de producto inválido."),
  size: z.string().trim().optional(),
  color: z.string().trim().optional(),
  sku: z.string().trim().optional(),
  stock: z.coerce.number().int().nonnegative("El stock no puede ser negativo."),
  status: z.enum(["activo", "inactivo"]).default("activo"),
});

export const variantSchema = baseVariantSchema.refine(
  (data) =>
    (data.size && data.size.length > 0) ||
    (data.color && data.color.length > 0),
  {
    message: "Debes especificar al menos una Talla o un Color.",
    path: ["size"],
  },
);

export const editVariantSchema = baseVariantSchema
  .extend({
    id: z.coerce.number(),
  })
  .refine(
    (data) =>
      (data.size && data.size.length > 0) ||
      (data.color && data.color.length > 0),
    {
      message: "Debes especificar al menos una Talla o un Color.",
      path: ["size"],
    },
  );

export interface FormVariantState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface RegisterVariantFormProps {
  productId: number;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  status: string;
}

export interface EditVariantFormProps {
  initialData: ProductVariant;
}

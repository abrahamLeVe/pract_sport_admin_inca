import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug inválido."),
  description: z.string().optional(),
  price: z.coerce.number().positive("El precio debe ser mayor a 0."),
  discount_price: z.coerce.number().optional().nullable(),
  stock: z.coerce.number().int().nonnegative("El stock no puede ser negativo."),
  category_id: z.coerce.number().int("Selecciona una categoría."),
  brand_id: z.coerce.number().int("Selecciona una marca."),
  status: z.enum(["activo", "inactivo"]).default("activo"),
});

export const editProductSchema = productSchema.extend({
  id: z.coerce.number(),
});

export interface FormProductState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

export interface RegisterProductFormProps {
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
}

export interface EditProductFormProps {
  initialData: {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: string | number;
    discount_price: string | number | null;
    stock: number;
    category_id: number;
    brand_id: number;
    images: string | { url: string; key: string }[];
    status: string;
  };
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
}

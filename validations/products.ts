import { z } from "zod";

// ============================================================================
// 1. ESQUEMAS DE PRODUCTO
// ============================================================================
export const productSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
    slug: z
      .string()
      .min(2, "El slug debe tener al menos 2 caracteres.")
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "Slug inválido. Usa solo minúsculas, números y guiones.",
      ),
    description: z.string().optional().nullable(),
    price: z.coerce.number().positive("El precio debe ser mayor a 0."),
    discount_price: z.coerce
      .number()
      .min(0, "El descuento no puede ser negativo.")
      .optional()
      .nullable(),
    track_stock: z.boolean().default(true),
    stock: z.coerce
      .number()
      .int()
      .nonnegative("El stock no puede ser negativo.")
      .default(0),

    // 🔥 Nuevas Relaciones Actualizadas
    category_id: z.coerce.number().int().min(1, "Selecciona una categoría."),
    brand_id: z.coerce.number().int().min(1, "Selecciona una marca."),
    gender_id: z.coerce.number().int().min(1, "Selecciona un género."),

    status: z.enum(["activo", "inactivo"]).default("activo"),

    // 🔥 Separación de Multimedia
    image: z.any().optional().nullable(), // Portada principal (image_url)
    images: z.any().optional().nullable(), // Galería secundaria (media_links)
    image_url: z.string().optional().nullable(),
    image_key: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.discount_price != null && data.discount_price >= data.price) {
        return false;
      }
      return true;
    },
    {
      message: "El precio de descuento debe ser menor al precio normal.",
      path: ["discount_price"],
    },
  );

export const editProductSchema = productSchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 2. TIPOS INFERIDOS (La magia de TypeScript)
// ============================================================================
export type ProductInput = z.infer<typeof productSchema>;
export type EditProductInput = z.infer<typeof editProductSchema>;

// ============================================================================
// 3. PROPS PARA LOS COMPONENTES
// ============================================================================
export interface RegisterProductFormProps {
  categories: { id: number; name: string }[];
  brands: { id: number; name: string }[];
  genders: { id: number; name: string }[]; // 🔥 Agregado para el select de géneros
}

export interface EditProductFormProps extends RegisterProductFormProps {
  initialData: EditProductInput & { has_variants?: boolean | string | number };
}

// ============================================================================
// 4. INTERFAZ PARA LA TABLA
// ============================================================================
export interface ProductTableItem {
  id: number;
  name: string;
  slug: string;
  price: number;
  discount_price: number | null;
  stock: number;
  status: string;
  track_stock: boolean;

  // 🔥 Reemplazamos el JSON viejo por los nuevos campos de Portada
  image_url: string | null;
  image_key: string | null;

  // Campos cruzados (JOINs)
  category_name: string | null;
  brand_name: string | null;
  gender_name: string | null; // 🔥 Para mostrar "Hombre/Mujer" en la tabla

  created_at: Date;

  // Campos virtuales para la DataTable
  is_active?: boolean;
  main_image?: string | null;
  has_variants?: string | null | boolean;
}

export interface TrashedProductDetail extends ProductTableItem {
  deleted_by_name: string | null;
  deleted_at_audit: Date;
  description: string | null;
}

import { z } from "zod";

// ============================================================================
// 1. COLORES (Master Colors)
// ============================================================================
export const colorSchema = z.object({
  name: z.string().min(1, "El nombre del color es obligatorio (ej. Negro)."),
  // 🔥 Validación con Regex para asegurar que si escriben un Hex, sea válido
  hex_code: z
    .string()
    .regex(
      /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      "Debe ser un código Hex válido (ej. #FF0000)",
    )
    .optional()
    .nullable()
    .or(z.literal("")), // Permite que el input quede vacío si el color no tiene código
});

export const editColorSchema = colorSchema.extend({
  id: z.coerce.number(),
});

export type ColorInput = z.infer<typeof colorSchema>;
export type EditColorInput = z.infer<typeof editColorSchema>;

export interface EditColorFormProps {
  initialData: EditColorInput;
}

// ============================================================================
// 2. TALLAS (Master Sizes)
// ============================================================================
export const sizeSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre de la talla es obligatorio (ej. M).")
    .max(20, "El nombre no puede tener más de 20 caracteres."),
  category: z.string().optional().nullable(),
});

export const editSizeSchema = sizeSchema.extend({
  id: z.coerce.number(),
});

export type SizeInput = z.infer<typeof sizeSchema>;
export type EditSizeInput = z.infer<typeof editSizeSchema>;

export interface EditSizeFormProps {
  initialData: EditSizeInput;
}

// ============================================================================
// 3. VARIANTES DE PRODUCTO (Product Variants)
// ============================================================================
const baseVariantSchema = z.object({
  product_id: z.coerce.number().int().min(1, "ID de producto inválido."),

  // 🔥 Reemplazamos los strings por las llaves foráneas numéricas
  size_id: z.coerce.number().optional().nullable(),
  color_id: z.coerce.number().optional().nullable(),

  sku: z.string().trim().optional().nullable(),
  stock: z.coerce.number().int().nonnegative("El stock no puede ser negativo."),
  track_stock: z.boolean().default(true),
  status: z.enum(["activo", "inactivo"]).default("activo"),
});

// Validación: Exigimos que al menos se seleccione un color o una talla
export const variantSchema = baseVariantSchema.refine(
  (data) =>
    (data.size_id && data.size_id > 0) || (data.color_id && data.color_id > 0),
  {
    message: "Debes seleccionar al menos una Talla o un Color.",
    path: ["size_id"],
  },
);

// Aplicamos el id y repetimos la regla de refinamiento (Zod lo requiere así)
export const editVariantSchema = baseVariantSchema
  .extend({
    id: z.coerce.number(),
  })
  .refine(
    (data) =>
      (data.size_id && data.size_id > 0) ||
      (data.color_id && data.color_id > 0),
    {
      message: "Debes seleccionar al menos una Talla o un Color.",
      path: ["size_id"],
    },
  );

export type VariantInput = z.infer<typeof variantSchema>;
export type EditVariantInput = z.infer<typeof editVariantSchema>;

// 4. PROPS PARA COMPONENTES DE VARIANTES
// ============================================================================

export interface RegisterVariantFormProps {
  productId: number;
  // 🔥 Usamos directamente los tipos de Zod en lugar de reescribirlos
  colors: EditColorInput[];
  sizes: EditSizeInput[];
  parentTrackStock?: boolean;
}

export interface EditVariantFormProps extends RegisterVariantFormProps {
  initialData: EditVariantInput;
}

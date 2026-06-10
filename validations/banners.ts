import { z } from "zod";
import React from "react";

// ============================================================================
// 1. ESQUEMAS DE VALIDACIÓN
// ============================================================================

export const bannerSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150),
  subtitle: z.string().max(255).optional().or(z.literal("")),
  link_url: z.string().optional().or(z.literal("")),
  event_id: z.coerce.number().optional().nullable(),
  type: z.enum(["general", "oferta", "evento", "novedad"]),
  sort_order: z.coerce
    .number()
    .int()
    .nonnegative("El orden debe ser un número positivo"),
  status: z.enum(["activo", "inactivo"]),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
});

// 🔥 DRY: Extendemos el esquema base para no repetir código
export const editBannerSchema = bannerSchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 2. TIPOS INFERIDOS
// ============================================================================
export type BannerInput = z.infer<typeof bannerSchema>;
export type EditBannerInput = z.infer<typeof editBannerSchema>;

// ============================================================================
// 3. PROPS DE COMPONENTES
// ============================================================================
export interface EditBannerFormProps extends React.ComponentProps<"div"> {
  // 🔥 Tipado estricto combinando lo inferido + la imagen que viene de tu BD
  initialData: EditBannerInput & {
    image_url: string;
  };
}

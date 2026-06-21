import { z } from "zod";

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
  image: z.any().optional(),
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
export interface EditBannerFormProps {
  // 🔥 Tipado estricto combinando lo inferido + la imagen que viene de tu BD
  initialData: EditBannerInput & {
    image_url: string;
  };
  events: { id: number; title: string }[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  image_key: string;
  link_url: string | null;
  type: string;
  sort_order: number;
  event_id: number | null;
  status: "activo" | "inactivo";
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;

  // 🔥 Campo virtual para la DataTable
  is_active?: boolean;
}

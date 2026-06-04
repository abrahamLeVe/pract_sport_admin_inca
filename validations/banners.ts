import { z } from "zod";

export const bannerSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150),
  subtitle: z.string().max(255).optional().or(z.literal("")),
  link_url: z.string().optional().or(z.literal("")),
  type: z.enum(["general", "oferta", "evento", "novedad"]),
  sort_order: z.coerce
    .number()
    .int()
    .nonnegative("El orden debe ser un número positivo"),
  status: z.enum(["activo", "inactivo"]),
  start_date: z.string().optional().or(z.literal("")),
  end_date: z.string().optional().or(z.literal("")),
});

export type BannerInput = z.infer<typeof bannerSchema>;

export type FormBannerState = {
  success?: boolean;
  message?: string;
  data?: any;
  zodErrors?: Record<string, string[]> | null;
};

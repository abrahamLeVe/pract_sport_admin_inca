import { z } from "zod";

export const clubSettingsSchema = z.object({
  name: z.string().min(1, "El nombre del club es obligatorio.").trim(),
  primary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido."),
  secondary_color: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido."),
  description: z.string().optional(),
  social_links: z.string().optional(),
});

export interface ClubSettings {
  id: number;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  description: string | null;
  social_links?: Record<string, string> | null;
}

export interface FormClubSettingsState {
  success: boolean;
  message: string;
  zodErrors?: Record<string, string[]> | null;
  data?: Record<string, any>;
}

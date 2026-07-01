import { z } from "zod";

// ============================================================================
// 1. ESQUEMAS DE LA TABLA 'media' (El Archivo Físico)
// ============================================================================
export const mediaSchema = z.object({
  // Datos Core
  media_type: z.enum(["image", "video", "document", "merch"]),
  media_url: z.string().min(1, "La URL o enlace del medio es obligatorio."),
  media_key: z.string().optional().nullable(),

  // Metadatos Técnicos
  file_name: z.string().optional().nullable(),
  file_format: z.string().optional().nullable(),
  size_bytes: z.coerce.number().optional().nullable(),
  width: z.coerce.number().optional().nullable(),
  height: z.coerce.number().optional().nullable(),
  alt_text: z.string().optional().nullable(),

  // Organización (Galería interna general)
  folder_name: z.string().default("general"),
});

export const editMediaSchema = mediaSchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 2. ESQUEMAS DE LA TABLA PIVOT 'media_links' (La Relación)
// ============================================================================
export const mediaLinkSchema = z.object({
  media_id: z.coerce.number().int(),
  model_type: z
    .string()
    .min(1, "El tipo de modelo es obligatorio (ej: 'event')."),
  model_id: z.coerce.number().int(),
  collection_name: z.string().default("gallery"),
  display_order: z.coerce.number().int().default(0),
});

// ============================================================================
// 3. TIPOS INFERIDOS (Para usar en Server Actions y UI)
// ============================================================================
export type MediaInput = z.infer<typeof mediaSchema>;
export type EditMediaInput = z.infer<typeof editMediaSchema>;
export type MediaLinkInput = z.infer<typeof mediaLinkSchema>;

// ============================================================================
// 4. ESTRUCTURAS DE BASE DE DATOS (Master Data)
// ============================================================================

// Fila pura de la tabla 'media' (Lo que ves en la vista global de la biblioteca)
export interface MediaRow {
  id: number;
  media_type: "image" | "video" | "document" | "merch";
  media_url: string;
  media_key: string | null;
  file_name: string | null;
  file_format: string | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  folder_name: string;
  created_at: Date;
  updated_at: Date;
}

// 🔥 Fila resultante del JOIN (Lo que recibe el frontend de un Evento/Producto)
// Combina los datos de la imagen con los datos de su relación (como el orden)
export interface MediaWithLinkRow extends MediaRow {
  link_id: number;
  model_type: string;
  model_id: number;
  collection_name: string;
  display_order: number;
}

// Props para el componente visual de la galería acoplada a una entidad
export interface MediaGalleryProps {
  modelType: string; // Ej: 'event'
  modelId: number; // Ej: 11
  initialMedia: MediaWithLinkRow[]; // Recibe los datos ya unidos por SQL
}

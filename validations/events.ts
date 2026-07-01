import { z } from "zod";

// ============================================================================
// 1. ESQUEMAS DE CATEGORÍAS (Fuente única)
// ============================================================================
export const eventCategorySchema = z
  .object({
    distance_id: z.coerce.number().min(1, "Selecciona una distancia."),
    gender_id: z.coerce.number().min(1, "Selecciona un género."),
    age_category_id: z.coerce
      .number()
      .min(1, "Selecciona una categoría de edad."),
    applied_min_age: z.coerce
      .number()
      .min(0, "La edad mínima no puede ser negativa."),
    applied_max_age: z.coerce
      .number()
      .min(0, "La edad máxima no puede ser negativa."),
    price: z.coerce.number().min(0, "El precio no puede ser negativo."),
    cupos: z.coerce.number().min(0, "Los cupos no pueden ser negativos."),
  })
  .refine((data) => data.applied_max_age >= data.applied_min_age, {
    message: "La edad máxima debe ser mayor o igual a la mínima.",
    path: ["applied_max_age"],
  });

export const editEventCategorySchema = eventCategorySchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 2. ESQUEMAS DEL EVENTO PRINCIPAL
// ============================================================================
export const eventSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres."),
  slug: z
    .string()
    .min(2, "El slug debe tener al menos 2 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug inválido. Usa solo minúsculas, números y guiones.",
    ),
  description: z.string().optional(),
  event_date: z.string().min(1, "La fecha del evento es obligatoria"), // String para evitar conflictos de serialización Date->Client
  location_name: z.string().min(2, "La ubicación es obligatoria."),
  latitude: z.coerce
    .number()
    .min(-90, "La latitud debe ser mayor a -90")
    .max(90, "La latitud debe ser menor a 90")
    .optional()
    .nullable(),
  longitude: z.coerce
    .number()
    .min(-180, "La longitud debe ser mayor a -180")
    .max(180, "La longitud debe ser menor a 180")
    .optional()
    .nullable(),
  route_geojson: z.any().optional().nullable(),
  event_type_id: z.coerce.number().min(1, "Selecciona un tipo de evento."),
  status: z
    .enum(["draft", "published", "completed", "cancelled"])
    .default("draft"),
  categories: z
    .array(eventCategorySchema)
    .min(1, "Debes agregar al menos una categoría al evento."),
});

export const editEventSchema = eventSchema.omit({ categories: true }).extend({
  id: z.coerce.number(),
});

// ============================================================================
// 2.1 ESQUEMAS DE GALERÍA MULTIMEDIA (Event Media)
// ============================================================================
export const eventMediaSchema = z.object({
  event_id: z.coerce.number().int(),
  media_type: z.enum(["image", "video", "merch"]),
  media_url: z.string().min(1, "La URL o enlace del medio es obligatorio."),
  media_key: z.string().optional().nullable(),
  alt_text: z.string().optional().nullable(),
  display_order: z.coerce.number().int().default(0),
});

export const editEventMediaSchema = eventMediaSchema.extend({
  id: z.coerce.number(),
});

// ============================================================================
// 3. TIPOS INFERIDOS (Para usar en Server Actions y UI)
// ============================================================================
export type EventCategoryInput = z.infer<typeof eventCategorySchema>;
export type EditEventCategoryInput = z.infer<typeof editEventCategorySchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type EditEventInput = z.infer<typeof editEventSchema>;
export type EventMediaInput = z.infer<typeof eventMediaSchema>;
export type EditEventMediaInput = z.infer<typeof editEventMediaSchema>;

// ============================================================================
// 4. ESTRUCTURAS DE BASE DE DATOS (Master Data & JOINS)
// ============================================================================
export interface MasterDataGrid {
  id: number;
  name: string;
}

export interface MasterAgeCategoryGrid {
  id: number;
  name: string;
  default_min_age: number;
  default_max_age: number;
}

export interface EventCategoryRow {
  id: number;
  event_id: number;
  distance_id: number;
  distance_name: string;
  gender_id: number;
  gender_name: string;
  age_category_id: number;
  age_category_name: string;
  applied_min_age: number;
  applied_max_age: number;
  price: number;
  cupos: number;
  registered_count: number;
}

export interface EventMediaRow {
  id: number;
  event_id: number;
  media_type: "image" | "video" | "merch";
  media_url: string;
  media_key: string | null;
  alt_text: string | null;
  display_order: number;
  created_at: Date;
}

// ============================================================================
// 1. BLOQUES BASE DE CATÁLOGOS (Piezas de Lego)
// ============================================================================

// Catálogos exclusivos para el Evento (Información general)
export interface EventMasterData {
  eventTypes: MasterDataGrid[];
}

// Catálogos exclusivos para las Categorías (Lógica de negocio)
export interface CategoryMasterData {
  distances: MasterDataGrid[];
  genders: MasterDataGrid[];
  ageCategories: MasterAgeCategoryGrid[];
}

// ============================================================================
// 2. PROPS DE LOS COMPONENTES (Armando las piezas)
// ============================================================================

// El registro usa TODO porque se hace en una sola pantalla
export interface RegisterEventFormProps
  extends EventMasterData, CategoryMasterData {}

// La edición del evento SOLO necesita los tipos de evento
export interface EditEventFormProps extends EventMasterData {
  initialData: EditEventInput & {
    image_url?: string | null;
  };
}

// La tabla de categorías SOLO necesita los catálogos de categorías
export interface EventCategoriesTableProps extends CategoryMasterData {
  eventId: number;
  categories: EventCategoryRow[];
}

// Props para la gestión de la galería multimedia
export interface EventMediaTableProps {
  eventId: number;
  mediaItems: EventMediaRow[];
}

// ============================================================================
// 3. INTERFAZ PARA LA TABLA
// ============================================================================
export interface EventTableItem {
  id: number;
  title: string;
  slug: string;
  location_name: string;
  event_date: Date;
  status: string;
  image_url: string | null;
  image_key: string | null;
  created_at: Date;
  updated_at: Date;

  // 🔥 Campo virtual para la DataTable
  is_active?: boolean;
}

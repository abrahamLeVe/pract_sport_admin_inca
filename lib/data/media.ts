import pool from "../db";
import { MediaRow, MediaWithLinkRow } from "@/validations/media";

// 1. OBTENER GALERÍA POR MODELO (Eventos, Productos, etc.)
// Usa INNER JOIN para traer los datos del archivo + su orden/relación
export async function getMediaByModelAction(
  modelType: string,
  modelId: number,
): Promise<MediaWithLinkRow[]> {
  try {
    const query = `
      SELECT 
        m.*, 
        ml.id as link_id, 
        ml.model_type, 
        ml.model_id, 
        ml.display_order, 
        ml.collection_name
      FROM media m
      INNER JOIN media_links ml ON m.id = ml.media_id
      WHERE ml.model_type = $1 
        AND ml.model_id = $2 
        AND m.deleted_at IS NULL
      ORDER BY ml.display_order ASC, m.created_at ASC
    `;
    const result = await pool.query(query, [modelType, modelId]);
    return result.rows as MediaWithLinkRow[];
  } catch (error) {
    console.error("❌ Error al obtener los medios por modelo:", error);
    return [];
  }
}

// 2. OBTENER BIBLIOTECA GLOBAL (Pestaña "Media Library" / Selector)
// Aquí no hacemos JOIN porque queremos ver archivos sueltos también
export async function getMediaLibraryAction(): Promise<MediaRow[]> {
  try {
    const query = `
      SELECT * FROM media 
      WHERE deleted_at IS NULL 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows as MediaRow[];
  } catch (error) {
    console.error("❌ Error al obtener la librería media:", error);
    return [];
  }
}

// 3. OBTENER DETALLE DE UN MEDIO
export async function getMediaByIdAction(id: number): Promise<MediaRow | null> {
  try {
    const query = `SELECT * FROM media WHERE id = $1 AND deleted_at IS NULL`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener el medio por ID:", error);
    return null;
  }
}

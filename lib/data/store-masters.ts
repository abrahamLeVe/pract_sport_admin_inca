import pool from "../db";
import { EditColorInput, EditSizeInput } from "@/validations/variants"; // Asume que la ruta es correcta

// ============================================================================
// 1. COLORES (Master Colors)
// ============================================================================

export async function getMasterColorByIdAction(
  id: number,
): Promise<EditColorInput | null> {
  try {
    const query = `SELECT id, name, hex_code FROM master_colors WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener color por ID:", error);
    return null;
  }
}

// 🔥 Alimenta la DataTable y los <select> de los formularios
export async function getAllMasterColorsAction(): Promise<EditColorInput[]> {
  try {
    const query = `SELECT id, name, hex_code FROM master_colors ORDER BY created_at DESC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todos los colores:", error);
    return [];
  }
}

// ============================================================================
// 2. TALLAS (Master Sizes)
// ============================================================================

export async function getMasterSizeByIdAction(
  id: number,
): Promise<EditSizeInput | null> {
  try {
    const query = `SELECT id, name, category FROM master_sizes WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener talla por ID:", error);
    return null;
  }
}

// 🔥 Alimenta la DataTable y los <select> respetando tu ordenamiento agrupado
export async function getAllMasterSizesAction(): Promise<EditSizeInput[]> {
  try {
    const query = `
      SELECT id, name, category 
      FROM master_sizes 
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las tallas:", error);
    return [];
  }
}

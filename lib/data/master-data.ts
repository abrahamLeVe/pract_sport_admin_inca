import pool from "../db";
import {
  EditDistanceInput,
  EditGenderInput,
  EditAgeCategoryInput,
  EditEventTypeInput,
} from "@/validations/master-data"; // Asume que tienes estos tipos exportados

// ============================================================================
// 1. DISTANCIAS (Master Distances)
// ============================================================================

export async function getMasterDistanceByIdAction(
  id: number,
): Promise<EditDistanceInput | null> {
  try {
    const query = `SELECT id, name FROM master_distances WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener distancia por ID:", error);
    return null;
  }
}

// 🔥 Esta es la única función que necesitas para alimentar a la DataTable
export async function getAllMasterDistancesAction(): Promise<
  EditDistanceInput[]
> {
  try {
    const query = `SELECT id, name FROM master_distances ORDER BY id DESC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las distancias:", error);
    return [];
  }
}

// ============================================================================
// 2. GÉNEROS (Master Genders)
// ============================================================================

export async function getMasterGenderByIdAction(
  id: number,
): Promise<EditGenderInput | null> {
  try {
    const query = `SELECT id, name FROM master_genders WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener género por ID:", error);
    return null;
  }
}

// 🔥 Esta es la única función que necesitas para alimentar a la DataTable
export async function getAllMasterGendersAction(): Promise<EditGenderInput[]> {
  try {
    const query = `SELECT id, name FROM master_genders ORDER BY id DESC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todos los géneros:", error);
    return [];
  }
}

// ============================================================================
// 3. CATEGORÍAS DE EDAD (Master Age Categories)
// ============================================================================

export async function getMasterAgeCategoryByIdAction(
  id: number,
): Promise<EditAgeCategoryInput | null> {
  try {
    const query = `
      SELECT id, name, default_min_age, default_max_age 
      FROM master_age_categories 
      WHERE id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener categoría de edad por ID:", error);
    return null;
  }
}

// 🔥 Esta es la única función que necesitas para alimentar a la DataTable
export async function getAllMasterAgeCategoriesAction(): Promise<
  EditAgeCategoryInput[]
> {
  try {
    const query = `
      SELECT id, name, default_min_age, default_max_age 
      FROM master_age_categories 
      ORDER BY default_min_age ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todas las categorías de edad:", error);
    return [];
  }
}

// ============================================================================
// 4. TIPOS DE EVENTO (Master Event Types)
// ============================================================================

export async function getMasterEventTypeByIdAction(
  id: number,
): Promise<EditEventTypeInput | null> {
  try {
    const query = `SELECT id, name FROM master_event_types WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener tipo de evento por ID:", error);
    return null;
  }
}

// 🔥 Esta es la única función que necesitas para alimentar a la DataTable
export async function getAllMasterEventTypesAction(): Promise<
  EditEventTypeInput[]
> {
  try {
    const query = `SELECT id, name FROM master_event_types ORDER BY id DESC`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error("❌ Error al obtener todos los tipos de evento:", error);
    return [];
  }
}

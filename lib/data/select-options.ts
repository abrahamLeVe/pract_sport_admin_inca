import pool from "../db";

export async function getSelectOptionsAction() {
  try {
    const categories = await pool.query(
      "SELECT id, name FROM categories WHERE status = 'activo' AND deleted_at IS NULL", // 🔥 Filtro aquí
    );
    const brands = await pool.query(
      "SELECT id, name FROM brands WHERE status = 'activo' AND deleted_at IS NULL", // 🔥 Filtro aquí
    );

    return {
      categories: categories.rows,
      brands: brands.rows,
    };
  } catch (error) {
    console.error("❌ Error cargando selectores:", error);
    return { categories: [], brands: [] };
  }
}

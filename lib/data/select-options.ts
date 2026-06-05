import pool from "../db";

export async function getSelectOptionsAction() {
  try {
    const categories = await pool.query(
      "SELECT id, name FROM categories WHERE status = 'activo'",
    );
    const brands = await pool.query(
      "SELECT id, name FROM brands WHERE status = 'activo'",
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

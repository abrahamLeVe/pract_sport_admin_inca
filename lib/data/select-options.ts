import pool from "../db";

export async function getSelectOptionsAction() {
  try {
    const categories = await pool.query(
      "SELECT id, name FROM categories WHERE status = 'activo' AND deleted_at IS NULL",
    );
    const brands = await pool.query(
      "SELECT id, name FROM brands WHERE status = 'activo' AND deleted_at IS NULL",
    );
    const genders = await pool.query("SELECT id, name FROM master_genders");

    return {
      categories: categories.rows,
      brands: brands.rows,
      genders: genders.rows,
    };
  } catch (error) {
    console.error("❌ Error cargando selectores:", error);
    return { categories: [], brands: [], genders: [] };
  }
}

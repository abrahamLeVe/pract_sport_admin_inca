import pool from "@/lib/db";

export interface InventoryData {
  summary: {
    totalProducts: number;
    totalVariants: number;
    totalStockUnits: number;
    outOfStock: number;
  };
  items: {
    productName: string;
    brand: string;
    category: string;
    sku: string;
    size: string;
    color: string;
    stock: number;
    status: string;
  }[];
  masterData: {
    brands: { name: string; status: string }[];
    categories: { name: string; status: string }[];
    colors: { name: string; hex: string }[];
    sizes: { name: string; category: string }[];
  };
}

export async function getInventoryReportData(): Promise<InventoryData> {
  try {
    // 1. Inventario Físico (El que ya teníamos)
    const inventoryQuery = pool.query(`
      SELECT 
        p.name AS product_name,
        COALESCE(b.name, 'Sin Marca') AS brand,
        COALESCE(c.name, 'Sin Categoría') AS category,
        p.status AS product_status,
        COALESCE(pv.sku, 'SIN-SKU') AS sku,
        COALESCE(ms.name, 'N/A') AS size,
        COALESCE(mc.name, 'N/A') AS color,
        COALESCE(pv.stock, p.stock, 0) AS stock,
        COALESCE(pv.status, 'inactivo') AS variant_status
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN master_sizes ms ON pv.size_id = ms.id
      LEFT JOIN master_colors mc ON pv.color_id = mc.id
      WHERE p.deleted_at IS NULL -- 🔥 1. Ocultamos productos borrados del Excel
      ORDER BY p.name ASC, mc.name ASC, ms.name ASC
    `);

    // 2. Datos Maestros (Marcas, Categorías, Colores, Tallas)
    const brandsQuery = pool.query(
      `SELECT name, status FROM brands WHERE deleted_at IS NULL ORDER BY name ASC`,
    );
    const categoriesQuery = pool.query(
      `SELECT name, status FROM categories WHERE deleted_at IS NULL ORDER BY name ASC`,
    );

    // Tallas y Colores no les pusimos deleted_at, así que se quedan igual
    const colorsQuery = pool.query(
      `SELECT name, COALESCE(hex_code, 'N/A') as hex FROM master_colors ORDER BY name ASC`,
    );
    const sizesQuery = pool.query(
      `SELECT name, COALESCE(category, 'General') as category FROM master_sizes ORDER BY category ASC, name ASC`,
    );

    // Ejecutamos todo en paralelo para no perder velocidad
    const [invRes, brandsRes, catRes, colRes, sizesRes] = await Promise.all([
      inventoryQuery,
      brandsQuery,
      categoriesQuery,
      colorsQuery,
      sizesQuery,
    ]);

    const rows = invRes.rows;
    const uniqueProducts = new Set(rows.map((r) => r.product_name)).size;
    const totalStockUnits = rows.reduce(
      (sum, r) => sum + parseInt(r.stock, 10),
      0,
    );
    const outOfStock = rows.filter((r) => parseInt(r.stock, 10) === 0).length;

    return {
      summary: {
        totalProducts: uniqueProducts,
        totalVariants: rows.length,
        totalStockUnits,
        outOfStock,
      },
      items: rows.map((r) => ({
        productName: r.product_name,
        brand: r.brand,
        category: r.category,
        sku: r.sku,
        size: r.size,
        color: r.color,
        stock: parseInt(r.stock, 10),
        status:
          r.variant_status === "activo" && r.product_status === "activo"
            ? "ACTIVO"
            : "INACTIVO",
      })),
      masterData: {
        brands: brandsRes.rows.map((r) => ({ name: r.name, status: r.status })),
        categories: catRes.rows.map((r) => ({
          name: r.name,
          status: r.status,
        })),
        colors: colRes.rows.map((r) => ({ name: r.name, hex: r.hex })),
        sizes: sizesRes.rows.map((r) => ({
          name: r.name,
          category: r.category,
        })),
      },
    };
  } catch (error) {
    console.error("Error al generar reporte de inventario:", error);
    throw new Error("No se pudo obtener el inventario.");
  }
}

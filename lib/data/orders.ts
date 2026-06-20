import pool from "@/lib/db";
import { Order, OrderItem } from "@/validations/orders";

// Obtener todos los pedidos para la tabla principal
export async function getOrders(): Promise<Order[]> {
  try {
    // Traemos los pedidos ordenados por fecha de creación (los más nuevos primero)
    const query = `SELECT * FROM orders ORDER BY created_at DESC`;
    const { rows } = await pool.query(query);
    return rows as Order[];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

// Obtener un pedido específico junto con sus productos (items)
export async function getOrderById(id: number): Promise<Order | null> {
  try {
    // 1. Buscamos el encabezado del pedido
    const orderQuery = `SELECT * FROM orders WHERE id = $1`;
    const { rows: orderRows } = await pool.query(orderQuery, [id]);

    if (orderRows.length === 0) return null;
    const order = orderRows[0] as Order;

    // 2. Buscamos los productos que pertenecen a este pedido
    const itemsQuery = `SELECT * FROM order_items WHERE order_id = $1`;
    const { rows: itemsRows } = await pool.query(itemsQuery, [id]);

    // 3. Juntamos todo en un solo objeto
    order.items = itemsRows as OrderItem[];

    return order;
  } catch (error) {
    console.error("Error fetching order by id:", error);
    return null;
  }
}

"use server";

import pool from "@/lib/db";

export async function globalSearchAction(query: string) {
  if (!query || query.length < 2) {
    return { athletes: [], orders: [] };
  }

  try {
    // Usamos ILIKE para búsquedas insensibles a mayúsculas/minúsculas
    const searchTerm = `%${query}%`;

    // 1. Buscar atletas (por nombre, apellido o DNI/Documento)
    const athletesPromise = pool.query(
      `
      SELECT 
        id, 
        participant_details->>'firstName' as first_name, 
        participant_details->>'lastName' as last_name, 
        participant_details->>'documentNumber' as document
      FROM event_registrations
      WHERE (
            participant_details->>'firstName' ILIKE $1
         OR participant_details->>'lastName' ILIKE $1
         OR participant_details->>'documentNumber' ILIKE $1
      ) 
      AND deleted_at IS NULL -- 🔥 Evita los resultados fantasmas
      LIMIT 5
    `,
      [searchTerm],
    );

    // 2. Buscar órdenes de la tienda (por ID de pedido, nombre o email)
    const ordersPromise = pool.query(
      `
      SELECT id, customer_name, customer_email, total_amount
      FROM orders
      WHERE (
            customer_name ILIKE $1 
         OR customer_email ILIKE $1 
         OR id::text = $1
      )
      AND deleted_at IS NULL -- 🔥 Evita los resultados fantasmas
      LIMIT 5
    `,
      [searchTerm],
    );

    const [athletesRes, ordersRes] = await Promise.all([
      athletesPromise,
      ordersPromise,
    ]);

    return {
      athletes: athletesRes.rows,
      orders: ordersRes.rows,
    };
  } catch (error) {
    console.error("Error en búsqueda global:", error);
    return { athletes: [], orders: [] };
  }
}

// 1. Lo que devuelve la tabla de event_registrations (Atletas)
export interface AthleteSearchResult {
  id: number;
  first_name: string;
  last_name: string;
  document: string;
}

// 2. Lo que devuelve la tabla de orders (Tienda)
export interface OrderSearchResult {
  id: number;
  customer_name: string;
  customer_email: string;
  total_amount?: number | string;
}

// 3. El objeto global que agrupa ambos resultados
export interface GlobalSearchResult {
  athletes: AthleteSearchResult[];
  orders: OrderSearchResult[];
}

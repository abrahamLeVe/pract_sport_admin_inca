import { EventTableItem } from "@/validations/events";
import pool from "../db";

export async function getEvents(): Promise<EventTableItem[]> {
  try {
    const query = `SELECT * FROM events WHERE deleted_at IS NULL ORDER BY event_date DESC`;
    const { rows } = await pool.query(query);
    return rows.map((row) => ({
      ...row,
      is_active: row.status === "published" || row.status === "activo",
    })) as EventTableItem[];
  } catch (error) {
    console.error("❌ Error en getEvents:", error);
    return [];
  }
}

export async function getEventByIdAction(id: number) {
  try {
    const query = `
      SELECT id, title, slug, description, event_date, location_name, latitude, longitude, route_geojson, event_type_id, status, image_url
      FROM events WHERE id = $1 AND deleted_at IS NULL
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error("❌ Error al obtener evento por ID:", error);
    return null;
  }
}

export async function getIdsTitlesEventsAction() {
  try {
    const query = `SELECT id, title, slug FROM events WHERE deleted_at IS NULL`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(`❌ Error al obtener los eventos:`, error);
    return [];
  }
}

export async function getTrashedEvents() {
  try {
    const query = `
      SELECT 
        id, 
        title, 
        slug, 
        event_date, 
        status, 
        image_url, 
        deleted_at as deleted_at_audit
      FROM events
      WHERE deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `;
    const { rows } = await pool.query(query);

    return rows.map((row) => ({
      ...row,
      is_active: row.status === "published" || row.status === "activo",
    }));
  } catch (error) {
    console.error("❌ Error en getTrashedEvents:", error);
    return [];
  }
}

export async function getTrashedEventDetailAction(eventId: number) {
  try {
    // Consulta 1: Datos base del evento + Auditoría
    const eventQuery = `
      SELECT 
        e.id, e.title, e.slug, e.description, e.event_date, e.location_name, 
        e.status, e.image_url, e.deleted_at as deleted_at_audit,
        u.name as deleted_by_name
      FROM events e
      LEFT JOIN audit_logs al ON al.record_id = e.id::text 
         AND al.table_name = 'events' 
         AND al.action IN ('SOFT_DELETE', 'BULK_SOFT_DELETE')
      LEFT JOIN users u ON al.user_id = u.id
      WHERE e.id = $1 AND e.deleted_at IS NOT NULL
      ORDER BY al.created_at DESC 
      LIMIT 1
    `;

    // Consulta 2: Imágenes de la Galería COMPLETA para MediaManager
    const mediaQuery = `
      SELECT 
        m.id, 
        m.media_type,      
        m.media_url, 
        m.alt_text, 
        m.file_name, 
        m.media_key,        /* 🔥 Necesario para borrar de S3 y para UI */
        m.width,            /* 🔥 Necesario para mostrar dimensiones */
        m.height,           /* 🔥 Necesario para mostrar dimensiones */
        m.size_bytes,       /* 🔥 Necesario para mostrar el peso (MB/KB) */
        m.file_format,      /* 🔥 Necesario para mostrar la extensión (PNG/WEBP) */
        ml.collection_name,
        ml.display_order,   /* 🔥 Necesario para el # de orden */
        ml.id as link_id  
      FROM media m
      JOIN media_links ml ON m.id = ml.media_id
      WHERE ml.model_type = 'event' AND ml.model_id = $1
      ORDER BY ml.display_order ASC
    `;

    // Consulta 3: Categorías del Evento (Con deleted_at y event_id)
    const categoriesQuery = `
      SELECT 
        ec.id, 
        ec.event_id,        /* 🔥 Necesario para las acciones (restaurar/borrar) */
        ec.price, 
        ec.cupos, 
        ec.applied_min_age, 
        ec.applied_max_age,
        ec.deleted_at,      /* 🔥 VITAL: Para saber si de verdad está en papelera o activo */
        md.name as distance_name,
        mg.name as gender_name,
        mac.name as age_category_name
      FROM event_categories ec
      LEFT JOIN master_distances md ON ec.distance_id = md.id
      LEFT JOIN master_genders mg ON ec.gender_id = mg.id
      LEFT JOIN master_age_categories mac ON ec.age_category_id = mac.id
      WHERE ec.event_id = $1
    `;

    // 🚀 Ejecutamos las 3 consultas al mismo tiempo
    const [eventResult, mediaResult, categoriesResult] = await Promise.all([
      pool.query(eventQuery, [eventId]),
      pool.query(mediaQuery, [eventId]),
      pool.query(categoriesQuery, [eventId]),
    ]);

    const eventData = eventResult.rows[0];

    if (!eventData) return null;

    return {
      ...eventData,
      media_gallery: mediaResult.rows,
      categories: categoriesResult.rows,
    };
  } catch (error) {
    console.error(
      `❌ Error al obtener el detalle del evento en papelera ${eventId}:`,
      error,
    );
    return null;
  }
}

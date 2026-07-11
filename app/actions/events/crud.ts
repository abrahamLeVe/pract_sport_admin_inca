"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { handleMediaUpload } from "@/lib/upload";
import { ActionState } from "@/validations/core";
import {
  EditEventInput,
  editEventSchema,
  EventInput,
  eventSchema,
} from "@/validations/events";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action } from "../storage";
const REVALIDATE_ROUTE = "/dashboard/events";

export async function createEventAction(
  prevState: ActionState<EventInput>,
  formData: FormData,
): Promise<ActionState<EventInput>> {
  await requireAdminSession();
  let client;

  const categoriesRaw = formData.get("categories")?.toString() || "[]";
  let categoriesParsed = [];
  try {
    categoriesParsed = JSON.parse(categoriesRaw);
  } catch (e) {
    categoriesParsed = [];
  }

  const routeGeojsonRaw = formData.get("route_geojson")?.toString() || "";

  const fields = {
    title: formData.get("title")?.toString() || "",
    slug: formData.get("slug")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    event_date: formData.get("event_date")?.toString() || "",
    location_name: formData.get("location_name")?.toString() || "",
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : null,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : null,
    route_geojson: routeGeojsonRaw,
    event_type_id: formData.get("event_type_id")
      ? Number(formData.get("event_type_id"))
      : 0,
    status: formData.get("status") as
      | "draft"
      | "published"
      | "completed"
      | "cancelled"
      | undefined,
    categories: categoriesParsed,
  };

  // 1. VALIDACIÓN ZOD (Primero para evitar consultas basura)
  const validatedFields = eventSchema.safeParse(fields);
  if (!validatedFields.success) {
    const flattenedErrors = z.flattenError(validatedFields.error);
    return {
      success: false,
      message: "Por favor, corrige los errores del formulario.",
      zodErrors: flattenedErrors.fieldErrors,
      data: fields,
    };
  }

  // 2. CHEQUEO DE SLUG (Solo si Zod es válido)
  const slugCheck = await pool.query(
    "SELECT id FROM events WHERE slug = $1 AND deleted_at IS NULL",
    [validatedFields.data.slug],
  );

  if ((slugCheck.rowCount ?? 0) > 0) {
    return {
      success: false,
      message: "Este Slug ya está en uso.",
      zodErrors: { slug: ["El slug ya existe."] },
      data: fields,
    };
  }

  // 3. PARSEO DE GEOJSON
  let routeGeojsonParsed = null;
  if (routeGeojsonRaw.trim() !== "") {
    try {
      routeGeojsonParsed = JSON.parse(routeGeojsonRaw);
    } catch (e) {
      return {
        success: false,
        message: "El código de la Ruta GeoJSON es inválido.",
        data: fields,
      };
    }
  }

  // 4. SUBIDA DE IMAGEN
  const imageResult = await handleMediaUpload(
    formData,
    "image",
    "events",
    "image",
    true,
  );
  if (!imageResult.success) {
    return {
      success: false,
      message: imageResult.message,
      zodErrors: { image: [imageResult.message || "Se requiere imagen"] },
      data: fields,
    };
  }

  // 5. DESTRUCTURACIÓN
  const {
    title,
    slug,
    description,
    event_date,
    location_name,
    latitude,
    longitude,
    event_type_id,
    status,
    categories,
  } = validatedFields.data;

  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const eventQuery = `
      INSERT INTO events (title,slug, description, event_date, location_name, latitude, longitude, route_geojson, event_type_id, status, image_url, image_key) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id
    `;
    const eventResult = await client.query(eventQuery, [
      title,
      slug,
      description || null,
      event_date,
      location_name,
      latitude,
      longitude,
      routeGeojsonParsed,
      event_type_id,
      status,
      imageResult.url,
      imageResult.key,
    ]);

    const newEventId = eventResult.rows[0].id;
    const categoryQuery = `
      INSERT INTO event_categories (event_id, distance_id, gender_id, age_category_id, applied_min_age, applied_max_age, price, cupos) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    for (const cat of categories) {
      await client.query(categoryQuery, [
        newEventId,
        cat.distance_id,
        cat.gender_id,
        cat.age_category_id,
        cat.applied_min_age,
        cat.applied_max_age,
        cat.price,
        cat.cupos,
      ]);
    }

    await client.query("COMMIT");
  } catch (error: any) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error en createEventAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado.",
      data: fields,
    };
  } finally {
    if (client) client.release();
  }

  revalidatePath(REVALIDATE_ROUTE);
  redirect(REVALIDATE_ROUTE);
}

export async function updateEventAction(
  prevState: ActionState<EditEventInput>,
  formData: FormData,
): Promise<ActionState<EditEventInput>> {
  await requireAdminSession();

  const rawId = formData.get("id")?.toString();
  const numericId = rawId ? parseInt(rawId, 10) : 0;

  const routeGeojsonRaw = formData.get("route_geojson")?.toString() || "";

  const fields = {
    id: numericId,
    title: formData.get("title")?.toString() || "",
    slug: formData.get("slug")?.toString() || "", // ✅ Slug agregado
    description: formData.get("description")?.toString() || "",
    event_date: formData.get("event_date")?.toString() || "",
    location_name: formData.get("location_name")?.toString() || "",
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : null,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : null,

    route_geojson: routeGeojsonRaw,

    event_type_id: formData.get("event_type_id")
      ? Number(formData.get("event_type_id"))
      : 0,
    status: formData.get("status") as
      | "draft"
      | "published"
      | "completed"
      | "cancelled"
      | undefined,
  };

  // 1. Validamos JSON
  let routeGeojsonParsed = null;
  if (routeGeojsonRaw.trim() !== "") {
    try {
      routeGeojsonParsed = JSON.parse(routeGeojsonRaw);
    } catch (e) {
      return {
        success: false,
        message: "El código de la Ruta GeoJSON es inválido.",
        data: fields,
      };
    }
  }

  // 2. Validación Zod (Antes de consultar BD)
  const validatedFields = editEventSchema.safeParse(fields);
  if (!validatedFields.success) {
    const flattenedErrors = z.flattenError(validatedFields.error);
    return {
      success: false,
      message: "Por favor, corrige los errores del formulario.",
      zodErrors: flattenedErrors.fieldErrors,
      data: fields,
    };
  }

  // 3. Verificación de Slug duplicado (Excluyendo el ID actual)
  const slugCheck = await pool.query(
    "SELECT id FROM events WHERE slug = $1 AND id != $2 AND deleted_at IS NULL",
    [validatedFields.data.slug, validatedFields.data.id],
  );

  if ((slugCheck.rowCount ?? 0) > 0) {
    return {
      success: false,
      message: "Este Slug ya está en uso por otro evento.",
      zodErrors: { slug: ["El slug ya existe."] },
      data: fields,
    };
  }

  // 4. Lógica de Imagen
  let newImageUrl = null;
  let newImageKey = null;
  const imageResult = await handleMediaUpload(
    formData,
    "image",
    "events",
    "image",
  );

  if (!imageResult.success) {
    return {
      success: false,
      message: imageResult.message,
      zodErrors: { image: [imageResult.message || "Se requiere imagen"] },
      data: fields,
    };
  }

  if (imageResult.url && imageResult.key) {
    newImageUrl = imageResult.url;
    newImageKey = imageResult.key;
    try {
      const oldEventQuery = "SELECT image_key FROM events WHERE id = $1";
      const oldEventResult = await pool.query(oldEventQuery, [fields.id]);
      const oldImageKey = oldEventResult.rows[0]?.image_key;
      if (oldImageKey) await deleteFileFromS3Action(oldImageKey);
    } catch (err) {
      console.error("⚠️ Error borrando imagen vieja:", err);
    }
  }

  const {
    id,
    title,
    slug,
    description,
    event_date,
    location_name,
    latitude,
    longitude,
    event_type_id,
    status,
  } = validatedFields.data;

  try {
    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE events SET 
          title = $1, slug = $2, description = $3, event_date = $4, location_name = $5, 
          latitude = $6, longitude = $7, route_geojson = $8, event_type_id = $9, status = $10, image_url = $11, image_key = $12, updated_at = NOW()
        WHERE id = $13
      `;
      await pool.query(query, [
        title,
        slug,
        description || null,
        event_date,
        location_name,
        latitude,
        longitude,
        routeGeojsonParsed,
        event_type_id,
        status,
        newImageUrl,
        newImageKey,
        id,
      ]);
    } else {
      const query = `
        UPDATE events SET 
          title = $1, slug = $2, description = $3, event_date = $4, location_name = $5, 
          latitude = $6, longitude = $7, route_geojson = $8, event_type_id = $9, status = $10, updated_at = NOW()
        WHERE id = $11
      `;
      await pool.query(query, [
        title,
        slug,
        description || null,
        event_date,
        location_name,
        latitude,
        longitude,
        routeGeojsonParsed,
        event_type_id,
        status,
        id,
      ]);
    }
    revalidatePath(REVALIDATE_ROUTE);
  } catch (error: any) {
    console.error("❌ Error en updateEventAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }

  redirect("/dashboard/events");
}

export async function toggleEventStatusAction(
  id: number,
  currentStatus: string,
): Promise<ActionState> {
  try {
    const session = await requireAdminSession();
    const nextStatus = currentStatus === "published" ? "draft" : "published";

    const query = `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

    // Auditoría estándar (tu estándar en otras funciones)
    await logAudit(session.user.id, "UPDATE", "events", id, {
      status: nextStatus,
    });

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `Evento ${nextStatus === "published" ? "publicado" : "ocultado"}.`,
    };
  } catch (error: any) {
    console.error("❌ Error en toggleEventStatusAction:", error.message);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

// ============================================================================
// ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteEventAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 🔥 NUEVO CANDADO: Evitar mandar a la papelera si tiene inscritos
      const registrationsCheck = await client.query(
        "SELECT COUNT(*) FROM event_registrations WHERE event_id = $1",
        [id],
      );

      if (parseInt(registrationsCheck.rows[0].count) > 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message:
            "No se puede enviar a la papelera. Este evento tiene atletas inscritos. Cambia su estado a 'Finalizado' en su lugar.",
        };
      }

      // 1. Soft delete del evento
      await client.query("UPDATE events SET deleted_at = NOW() WHERE id = $1", [
        id,
      ]);

      await client.query("COMMIT");
      await logAudit(adminId, "SOFT_DELETE", "events", id);

      // Asegúrate de importar o tener definida REVALIDATE_ROUTE
      revalidatePath("/dashboard/events");

      return { success: true, message: "Evento movido a la papelera." };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error en deleteEventAction:", error.message);
    return { success: false, message: "No se pudo eliminar el evento." };
  }
}

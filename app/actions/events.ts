"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { handleImageUpload } from "@/lib/upload";
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
import { deleteFileFromS3Action } from "./storage";

// ============================================================================
// 1. CREATE EVENT
// ============================================================================
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

  // 1. Extraemos el texto crudo del GeoJSON
  const routeGeojsonRaw = formData.get("route_geojson")?.toString() || "";

  // 2. Armamos LOS FIELDS PRIMERO (usando el texto crudo para route_geojson)
  const fields = {
    title: formData.get("title")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    event_date: formData.get("event_date")?.toString() || "",
    location_name: formData.get("location_name")?.toString() || "",
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : null,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : null,

    route_geojson: routeGeojsonRaw, // ✅ Se queda como string para React

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

  // 3. Validamos JSON
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

  const imageResult = await handleImageUpload(
    formData,
    "image",
    "events",
    true,
  );
  if (!imageResult.success) {
    return {
      success: false,
      message: imageResult.message || "Error con la imagen",
      zodErrors: {
        image: [imageResult.message || "Error con la imagen"],
      } as any,
      data: fields,
    };
  }

  const {
    title,
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
      INSERT INTO events (title, description, event_date, location_name, latitude, longitude, route_geojson, event_type_id, status, image_url, image_key) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id
    `;
    const eventResult = await client.query(eventQuery, [
      title,
      description || null,
      event_date,
      location_name,
      latitude,
      longitude,
      routeGeojsonParsed, // 🔥 ¡AQUÍ mandamos el objeto JSON parseado a PostgreSQL!
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

  revalidatePath("/dashboard/events");
  redirect("/dashboard/events");
}

export async function updateEventAction(
  prevState: ActionState<EditEventInput>,
  formData: FormData,
): Promise<ActionState<EditEventInput>> {
  await requireAdminSession();

  const rawId = formData.get("id")?.toString();
  const numericId = rawId ? parseInt(rawId, 10) : 0;

  // 1. Extraemos crudo
  const routeGeojsonRaw = formData.get("route_geojson")?.toString() || "";

  // 2. Armamos fields con el crudo
  const fields = {
    id: numericId,
    title: formData.get("title")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    event_date: formData.get("event_date")?.toString() || "",
    location_name: formData.get("location_name")?.toString() || "",
    latitude: formData.get("latitude")
      ? Number(formData.get("latitude"))
      : null,
    longitude: formData.get("longitude")
      ? Number(formData.get("longitude"))
      : null,

    route_geojson: routeGeojsonRaw, // ✅ Se queda como string

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

  // 3. Validamos JSON
  let routeGeojsonParsed = null;
  if (routeGeojsonRaw.trim() !== "") {
    try {
      routeGeojsonParsed = JSON.parse(routeGeojsonRaw);
    } catch (e) {
      return {
        success: false,
        message: "El código de la Ruta GeoJSON es inválido.",
        data: fields, // ✅ No se pierde nada
      };
    }
  }

  // 4. Validamos Zod
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

  let newImageUrl = null;
  let newImageKey = null;
  const imageResult = await handleImageUpload(formData, "image", "events");

  if (!imageResult.success) {
    return {
      success: false,
      message: imageResult.message || "Error con la imagen",
      zodErrors: {
        image: [imageResult.message || "Error con la imagen"],
      } as any,
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
          title = $1, description = $2, event_date = $3, location_name = $4, 
          latitude = $5, longitude = $6, route_geojson = $7, event_type_id = $8, status = $9, image_url = $10, image_key = $11, updated_at = NOW()
        WHERE id = $12
      `;
      await pool.query(query, [
        title,
        description || null,
        event_date,
        location_name,
        latitude,
        longitude,
        routeGeojsonParsed, // 🔥 Mandamos el objeto parseado a BD
        event_type_id,
        status,
        newImageUrl,
        newImageKey,
        id,
      ]);
    } else {
      const query = `
        UPDATE events SET 
          title = $1, description = $2, event_date = $3, location_name = $4, 
          latitude = $5, longitude = $6, route_geojson = $7, event_type_id = $8, status = $9, updated_at = NOW()
        WHERE id = $10
      `;
      await pool.query(query, [
        title,
        description || null,
        event_date,
        location_name,
        latitude,
        longitude,
        routeGeojsonParsed, // 🔥 Mandamos el objeto parseado a BD
        event_type_id,
        status,
        id,
      ]);
    }
    revalidatePath("/dashboard/events");
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

export async function deleteEventAction(id: number) {
  await requireAdminSession();
  try {
    const getQuery = "SELECT image_key FROM events WHERE id = $1";
    const result = await pool.query(getQuery, [id]);
    const eventRecord = result.rows[0];

    if (!eventRecord)
      return { success: false, message: "El evento no existe." };

    if (eventRecord.image_key) {
      await deleteFileFromS3Action(eventRecord.image_key);
    }

    const deleteQuery = "DELETE FROM events WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    revalidatePath("/dashboard/events");
    return { success: true, message: "Evento eliminado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en deleteEventAction:", error.message);
    return {
      success: false,
      message:
        "No se pudo eliminar el evento (quizás tiene inscripciones asociadas).",
    };
  }
}

export async function toggleEventStatusAction(
  id: number,
  currentStatus: string,
): Promise<ActionState> {
  try {
    const nextStatus = currentStatus === "published" ? "draft" : "published";

    const query = `UPDATE events SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

    revalidatePath("/dashboard/events");
    return {
      success: true,
      message: `Evento ${nextStatus === "published" ? "publicado" : "ocultado"}.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleEventStatusAction:", error);
    return { success: false, message: "No se pudo cambiar el estado." };
  }
}

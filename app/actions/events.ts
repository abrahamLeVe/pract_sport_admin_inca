"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  eventSchema,
  editEventSchema,
  FormEventState,
} from "@/validations/events";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";
import { deleteFileFromS3Action, uploadFileToS3Action } from "./storage";

export async function createEventAction(
  prevState: FormEventState,
  formData: FormData,
): Promise<FormEventState> {
  let client;
  await requireAdminSession();

  const categoriesRaw = formData.get("categories")?.toString() || "[]";
  let categoriesParsed = [];
  try {
    categoriesParsed = JSON.parse(categoriesRaw);
  } catch (e) {
    categoriesParsed = [];
  }

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
    event_type_id: formData.get("event_type_id")
      ? Number(formData.get("event_type_id"))
      : 0,
    status: formData.get("status")?.toString() || "draft",
    categories: categoriesParsed,
  };

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

  try {
    const imageFile = formData.get("image") as File;
    let imageUrl = null;
    let imageKey = null;

    if (imageFile && imageFile.size > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        return {
          success: false,
          message: "Formato no permitido. Solo JPG, PNG o WEBP.",
          data: fields,
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera el límite de 5MB.",
          data: fields,
        };
      }

      const s3Result = await uploadFileToS3Action(imageFile, "events");
      if (!s3Result.success || !s3Result.key || !s3Result.url) {
        throw new Error(s3Result.message || "Error al subir la imagen a S3.");
      }
      imageUrl = s3Result.url;
      imageKey = s3Result.key;
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

    client = await pool.connect();
    await client.query("BEGIN");

    const eventQuery = `
      INSERT INTO events (
        title, description, event_date, location_name, latitude, longitude, event_type_id, status, image_url, image_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;

    const eventResult = await client.query(eventQuery, [
      title,
      description || null,
      event_date,
      location_name,
      latitude,
      longitude,
      event_type_id,
      status,
      imageUrl,
      imageKey,
    ]);

    const newEventId = eventResult.rows[0].id;

    const categoryQuery = `
      INSERT INTO event_categories (
        event_id, distance_id, gender_id, age_category_id, applied_min_age, applied_max_age, price, cupos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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

    revalidatePath("/dashboard/events");
  } catch (error: any) {
    if (client) await client.query("ROLLBACK");
    console.error("❌ Error en createEventAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
      data: fields,
    };
  } finally {
    if (client) client.release();
  }

  redirect("/dashboard/events");
}

export async function updateEventAction(
  prevState: FormEventState,
  formData: FormData,
): Promise<FormEventState> {
  try {
    await requireAdminSession();

    const fields = {
      id: formData.get("id")?.toString() || "",
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
      event_type_id: formData.get("event_type_id")
        ? Number(formData.get("event_type_id"))
        : 0,
      status: formData.get("status")?.toString() || "draft",

      categories: [
        {
          distance_id: 1,
          gender_id: 1,
          age_category_id: 1,
          applied_min_age: 0,
          applied_max_age: 99,
          price: 0,
          cupos: 0,
        },
      ],
    };

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

    const imageFile = formData.get("image") as File;
    let newImageUrl = null;
    let newImageKey = null;

    if (imageFile && imageFile.size > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        return {
          success: false,
          message: "Formato no permitido.",
          data: fields,
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera 5MB.",
          data: fields,
        };
      }

      const oldEventResult = await pool.query(
        "SELECT image_key FROM events WHERE id = $1",
        [id],
      );
      const oldImageKey = oldEventResult.rows[0]?.image_key;

      const s3Result = await uploadFileToS3Action(imageFile, "events");
      if (s3Result.success) {
        newImageUrl = s3Result.url;
        newImageKey = s3Result.key;

        if (oldImageKey) await deleteFileFromS3Action(oldImageKey);
      } else {
        throw new Error(s3Result.message || "Error al subir la nueva imagen.");
      }
    }

    if (newImageUrl && newImageKey) {
      const query = `
        UPDATE events SET 
          title = $1, description = $2, event_date = $3, location_name = $4, 
          latitude = $5, longitude = $6, event_type_id = $7, status = $8, image_url = $9, image_key = $10, updated_at = NOW()
        WHERE id = $11
      `;
      await pool.query(query, [
        title,
        description || null,
        event_date,
        location_name,
        latitude,
        longitude,
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
          latitude = $5, longitude = $6, event_type_id = $7, status = $8, updated_at = NOW()
        WHERE id = $9
      `;
      await pool.query(query, [
        title,
        description || null,
        event_date,
        location_name,
        latitude,
        longitude,
        event_type_id,
        status,
        id,
      ]);
    }

    revalidatePath("/dashboard/events");
  } catch (error: any) {
    console.error("❌ Error en updateEventAction:", error.message);
    return { success: false, message: error.message || "Error al actualizar." };
  }

  redirect("/dashboard/events");
}

// =========================================================
// LAS ACCIONES DE BORRAR Y CAMBIAR ESTADO SIGUEN EXACTAMENTE IGUAL
// =========================================================

export async function deleteEventAction(id: number) {
  try {
    await requireAdminSession();

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
) {
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

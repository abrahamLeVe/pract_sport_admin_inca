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
  try {
    await requireAdminSession();

    const fields = {
      title: formData.get("title")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      event_date: formData.get("event_date")?.toString() || "",
      location: formData.get("location")?.toString() || "",
      event_type: formData.get("event_type")?.toString() || "",
      distances: formData.get("distances")?.toString() || "",
      max_participants: formData.get("max_participants")?.toString() || "",
      status: formData.get("status")?.toString() || "draft",
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
      location,
      event_type,
      distances,
      max_participants,
      status,
    } = validatedFields.data;

    const query = `
      INSERT INTO events (
        title, description, event_date, location, event_type, distances, max_participants, status, image_url, image_key
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await pool.query(query, [
      title,
      description || null,
      event_date,
      location,
      event_type,
      distances || null,
      max_participants || null,
      status,
      imageUrl,
      imageKey,
    ]);

    revalidatePath("/dashboard/events");
  } catch (error: any) {
    console.error("❌ Error en createEventAction:", error.message);
    return {
      success: false,
      message: error.message || "Ocurrió un error inesperado en el servidor.",
    };
  }

  redirect("/dashboard/events");
}

export async function updateEventAction(
  prevState: FormEventState,
  formData: FormData,
): Promise<FormEventState> {
  try {
    await requireAdminSession();

    const rawFormData = {
      id: formData.get("id")?.toString() || "",
      title: formData.get("title")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      event_date: formData.get("event_date")?.toString() || "",
      location: formData.get("location")?.toString() || "",
      event_type: formData.get("event_type")?.toString() || "",
      distances: formData.get("distances")?.toString() || "",
      max_participants: formData.get("max_participants")?.toString() || "",
      status: formData.get("status")?.toString() || "draft",
    };

    const validatedFields = editEventSchema.safeParse(rawFormData);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: rawFormData,
      };
    }

    const {
      id,
      title,
      description,
      event_date,
      location,
      event_type,
      distances,
      max_participants,
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
          data: rawFormData,
        };
      }
      if (imageFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera 5MB.",
          data: rawFormData,
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
          title = $1, description = $2, event_date = $3, location = $4, 
          event_type = $5, distances = $6, max_participants = $7, status = $8, image_url = $9, image_key = $10, updated_at = NOW()
        WHERE id = $11
      `;
      await pool.query(query, [
        title,
        description || null,
        event_date,
        location,
        event_type,
        distances || null,
        max_participants || null,
        status,
        newImageUrl,
        newImageKey,
        id,
      ]);
    } else {
      const query = `
        UPDATE events SET 
          title = $1, description = $2, event_date = $3, location = $4, 
          event_type = $5, distances = $6, max_participants = $7, status = $8, updated_at = NOW()
        WHERE id = $9
      `;
      await pool.query(query, [
        title,
        description || null,
        event_date,
        location,
        event_type,
        distances || null,
        max_participants || null,
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

"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import { revalidatePath } from "next/cache";
import { deleteFileFromS3Action } from "../storage";

const TRASH_ROUTE = "/dashboard/events/trash";
const EVENTS_ROUTE = "/dashboard/events";

// ============================================================================
// 1. RESTAURACIÓN (Individual y Masiva)
// ============================================================================
export async function restoreEventAction(
  id: number,
): Promise<ActionState<any>> {
  try {
    const session = await requireAdminSession();
    await pool.query("UPDATE events SET deleted_at = NULL WHERE id = $1", [id]);
    await logAudit(session.user.id, "RESTORE", "events", id);

    revalidatePath(EVENTS_ROUTE);
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: "Evento restaurado correctamente." };
  } catch (error) {
    console.error("❌ Error en restoreEventAction:", error);
    return { success: false, message: "Error al restaurar el evento." };
  }
}

export async function bulkRestoreEventsAction(
  ids: number[],
): Promise<ActionState<any>> {
  if (!ids?.length)
    return { success: false, message: "No hay eventos seleccionados." };

  try {
    const session = await requireAdminSession();
    await pool.query("UPDATE events SET deleted_at = NULL WHERE id = ANY($1)", [
      ids,
    ]);
    await logAudit(session.user.id, "BULK_RESTORE", "events", ids.join(","));

    revalidatePath(EVENTS_ROUTE);
    revalidatePath(TRASH_ROUTE);
    return { success: true, message: `${ids.length} eventos restaurados.` };
  } catch (error) {
    console.error("❌ Error en bulkRestoreEventsAction:", error);
    return { success: false, message: "Error al restaurar los eventos." };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete con protección)
// ============================================================================
export async function permanentlyDeleteEventAction(
  id: number,
): Promise<ActionState<any>> {
  try {
    const session = await requireAdminSession();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 🔥 CANDADO DE SEGURIDAD: Verificar si el evento tiene participantes inscritos
      const registrationsCheck = await client.query(
        "SELECT COUNT(*) FROM event_registrations WHERE event_id = $1",
        [id],
      );

      if (parseInt(registrationsCheck.rows[0].count) > 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message:
            "No se puede eliminar permanentemente. Este evento ya cuenta con atletas inscritos.",
        };
      }

      // 1. Obtener el Thumbnail/Portada principal del evento
      const eventRecord = await client.query(
        "SELECT image_key FROM events WHERE id = $1",
        [id],
      );
      const mainImageKey = eventRecord.rows[0]?.image_key;

      // 2. Identificar qué archivos de la galería están vinculados a este evento
      const mediaList = await client.query(
        "SELECT media_id FROM media_links WHERE model_type = 'event' AND model_id = $1",
        [id],
      );

      // 3. Eliminar los vínculos de la galería
      await client.query(
        "DELETE FROM media_links WHERE model_type = 'event' AND model_id = $1",
        [id],
      );

      // 4. Garbage Collector de Galería: Verificar si los archivos se usan en otro lado
      for (const row of mediaList.rows) {
        const checkLinks = await client.query(
          "SELECT COUNT(*) FROM media_links WHERE media_id = $1",
          [row.media_id],
        );

        if (parseInt(checkLinks.rows[0].count) === 0) {
          const mediaFile = await client.query(
            "SELECT media_key FROM media WHERE id = $1",
            [row.media_id],
          );
          if (mediaFile.rows[0]?.media_key) {
            await deleteFileFromS3Action(mediaFile.rows[0].media_key);
          }
          await client.query("DELETE FROM media WHERE id = $1", [row.media_id]);
        }
      }

      // 5. Borrar la portada principal de S3 si existe
      if (mainImageKey) {
        await deleteFileFromS3Action(mainImageKey);
      }

      // 6. Borrar el evento (Ahora seguro, porque sabemos que tiene 0 inscritos)
      await client.query("DELETE FROM events WHERE id = $1", [id]);

      await client.query("COMMIT");
      await logAudit(session.user.id, "HARD_DELETE", "events", id);
      revalidatePath(TRASH_ROUTE);

      return {
        success: true,
        message: "Evento, galería y archivos eliminados permanentemente.",
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteEventAction:", error.message);
    return { success: false, message: "No se pudo purgar el evento." };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete protegido)
// ============================================================================
export async function bulkPermanentlyDeleteEventsAction(
  ids: number[],
): Promise<ActionState<any>> {
  try {
    const session = await requireAdminSession();
    if (!ids || ids.length === 0)
      return { success: false, message: "No hay eventos seleccionados." };

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 🔥 CANDADO DE SEGURIDAD MASIVO: Verificar si ALGUNO de los eventos tiene inscritos
      const bulkCheck = await client.query(
        "SELECT COUNT(*) FROM event_registrations WHERE event_id = ANY($1)",
        [ids],
      );

      if (parseInt(bulkCheck.rows[0].count) > 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message:
            "Operación cancelada. Uno o más eventos seleccionados ya tienen atletas inscritos y no pueden ser eliminados.",
        };
      }

      // 1. Obtener las portadas principales de los eventos a borrar
      const eventsList = await client.query(
        "SELECT image_key FROM events WHERE id = ANY($1)",
        [ids],
      );

      // 2. Obtener los media_ids de la galería asociados a estos eventos
      const mediaList = await client.query(
        "SELECT DISTINCT media_id FROM media_links WHERE model_type = 'event' AND model_id = ANY($1)",
        [ids],
      );

      // 3. Borrar vínculos de galería
      await client.query(
        "DELETE FROM media_links WHERE model_type = 'event' AND model_id = ANY($1)",
        [ids],
      );

      // 4. Garbage Collector de Galería
      for (const row of mediaList.rows) {
        const check = await client.query(
          "SELECT COUNT(*) FROM media_links WHERE media_id = $1",
          [row.media_id],
        );

        if (parseInt(check.rows[0].count) === 0) {
          const mediaFile = await client.query(
            "SELECT media_key FROM media WHERE id = $1",
            [row.media_id],
          );
          if (mediaFile.rows[0]?.media_key) {
            await deleteFileFromS3Action(mediaFile.rows[0].media_key);
          }
          await client.query("DELETE FROM media WHERE id = $1", [row.media_id]);
        }
      }

      // 5. Borrar las portadas principales de S3
      for (const row of eventsList.rows) {
        if (row.image_key) {
          await deleteFileFromS3Action(row.image_key);
        }
      }

      // 6. Borrar los eventos
      await client.query("DELETE FROM events WHERE id = ANY($1)", [ids]);

      await client.query("COMMIT");
      await logAudit(
        session.user.id,
        "BULK_HARD_DELETE",
        "events",
        ids.join(","),
      );
      revalidatePath(TRASH_ROUTE);

      return {
        success: true,
        message: "Eventos y archivos eliminados permanentemente.",
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteEventsAction:",
      error.message,
    );
    return { success: false, message: "Error al purgar eventos masivamente." };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteEventsAction(
  ids: number[],
): Promise<ActionState<any>> {
  try {
    const session = await requireAdminSession();

    if (!ids || ids.length === 0)
      return { success: false, message: "No hay eventos seleccionados." };

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // 🔥 NUEVO CANDADO MASIVO: Verificar si ALGUNO tiene inscritos
      const bulkCheck = await client.query(
        "SELECT COUNT(*) FROM event_registrations WHERE event_id = ANY($1)",
        [ids],
      );

      if (parseInt(bulkCheck.rows[0].count) > 0) {
        await client.query("ROLLBACK");
        return {
          success: false,
          message:
            "Operación cancelada. Uno o más eventos seleccionados tienen inscritos y no pueden ir a la papelera.",
        };
      }

      // Solo actualizamos "events"
      await client.query(
        "UPDATE events SET deleted_at = NOW() WHERE id = ANY($1)",
        [ids],
      );

      await client.query("COMMIT");
      await logAudit(
        session.user.id,
        "BULK_SOFT_DELETE",
        "events",
        ids.join(","),
      );

      revalidatePath("/dashboard/events");
      revalidatePath("/dashboard/events/trash");

      return {
        success: true,
        message: `${ids.length} eventos movidos a la papelera.`,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteEventsAction:", error.message);
    return { success: false, message: "Error al eliminar los eventos." };
  }
}

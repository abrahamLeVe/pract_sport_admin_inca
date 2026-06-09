"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import {
  clubSettingsSchema,
  FormClubSettingsState,
} from "@/validations/settings";
import { revalidatePath } from "next/cache";
import z from "zod";
import { deleteFileFromS3Action, uploadFileToS3Action } from "./storage";

export async function updateClubSettingsAction(
  prevState: FormClubSettingsState,
  formData: FormData,
): Promise<FormClubSettingsState> {
  try {
    await requireAdminSession();

    const fields = {
      name: formData.get("name")?.toString() || "",
      primary_color: formData.get("primary_color")?.toString() || "",
      secondary_color: formData.get("secondary_color")?.toString() || "",
      description: formData.get("description")?.toString() || "",
      social_links: formData.get("social_links")?.toString() || "[]",
    };

    const validatedFields = clubSettingsSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    const { name, primary_color, secondary_color, description, social_links } =
      validatedFields.data;

    let parsedSocialLinks: Record<string, string> = {};
    try {
      const linksArray = JSON.parse(social_links || "[]");
      linksArray.forEach((link: { platform: string; url: string }) => {
        if (link.platform.trim() !== "" && link.url.trim() !== "") {
          parsedSocialLinks[link.platform.trim()] = link.url.trim();
        }
      });
    } catch (e) {
      parsedSocialLinks = {};
    }

    const logoFile = formData.get("logo") as File;
    let newLogoUrl = null;

    if (logoFile && logoFile.size > 0) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(logoFile.type)) {
        return {
          success: false,
          message: "Formato no permitido.",
          data: fields,
        };
      }
      if (logoFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "La imagen supera 5MB.",
          data: fields,
        };
      }

      const oldSettingsResult = await pool.query(
        "SELECT logo_url FROM club_settings WHERE id = 1",
      );
      const oldLogoUrl = oldSettingsResult.rows[0]?.logo_url;

      const s3Result = await uploadFileToS3Action(logoFile, "settings");
      if (s3Result.success && s3Result.url) {
        newLogoUrl = s3Result.url;

        if (oldLogoUrl) {
          try {
            const oldKey = decodeURIComponent(
              new URL(oldLogoUrl).pathname.substring(1),
            );
            await deleteFileFromS3Action(oldKey);
          } catch (deleteError) {
            console.error(
              "No se pudo borrar el logo antiguo de S3:",
              deleteError,
            );
          }
        }
      } else {
        throw new Error("Error al subir el logo a S3.");
      }
    }

    const query = `
      INSERT INTO club_settings (id, name, primary_color, secondary_color, description, social_links, logo_url)
      VALUES (1, $1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        name = EXCLUDED.name,
        primary_color = EXCLUDED.primary_color,
        secondary_color = EXCLUDED.secondary_color,
        description = EXCLUDED.description,
        social_links = EXCLUDED.social_links,
        logo_url = COALESCE(EXCLUDED.logo_url, club_settings.logo_url),
        updated_at = NOW()
    `;

    await pool.query(query, [
      name,
      primary_color,
      secondary_color,
      description || null,
      JSON.stringify(parsedSocialLinks),
      newLogoUrl,
    ]);

    revalidatePath("/dashboard/settings");

    return {
      success: true,
      message: "Configuración guardada correctamente.",
      data: {},
    };
  } catch (error: any) {
    console.error("❌ Error en updateClubSettingsAction:", error.message);
    return { success: false, message: error.message || "Error al actualizar." };
  }
}

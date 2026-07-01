"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { handleMediaUpload } from "@/lib/upload";
import { ActionState } from "@/validations/core";
import { ProfileFormValues, profileSchema } from "@/validations/profile";
import { z } from "zod";
import { deleteFileFromS3Action } from "./storage";
// 🔥 IMPORTA TU UTILIDAD DE IMÁGENES (Ajusta la ruta según tu proyecto)

export async function updateProfileAction(
  prevState: ActionState<ProfileFormValues>,
  formData: FormData,
): Promise<ActionState<ProfileFormValues>> {
  const rawUserId = formData.get("user_id")?.toString();
  const userIdNum = rawUserId ? parseInt(rawUserId, 10) : 0;

  const fields: ProfileFormValues = {
    name: formData.get("name")?.toString() || "",
    document_type: formData.get("document_type")?.toString() || "DNI",
    document_number: formData.get("document_number")?.toString() || "",
    phone: formData.get("phone")?.toString() || "",
    address: formData.get("address")?.toString() || "",
    city: formData.get("city")?.toString() || "",
    country: formData.get("country")?.toString() || "Perú",
    birth_date: formData.get("birth_date")?.toString() || "",
    gender: formData.get("gender")?.toString() || "",
    blood_type: formData.get("blood_type")?.toString() || "",
    tshirt_size: formData.get("tshirt_size")?.toString() || "",
    emergency_contact: formData.get("emergency_contact")?.toString() || "",
    emergency_phone: formData.get("emergency_phone")?.toString() || "",
  };

  try {
    const validatedFields = profileSchema.safeParse(fields);
    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, corrige los errores del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields,
      };
    }

    // 🔥 1. PROCESAMOS LA IMAGEN (Igual que en los Banners)
    let newImageUrl = null;

    // Asumimos que los guardas en una carpeta llamada "profiles" o "avatars" en tu S3
    const imageResult = await handleMediaUpload(
      formData,
      "image",
      "avatars",
      "image",
      false,
    );

    if (!imageResult.success) {
      return {
        success: false,
        message: imageResult.message || "Error al subir la imagen",
        data: fields,
      };
    }

    if (imageResult.url) {
      newImageUrl = imageResult.url;
      // 1. Consultamos la imagen antigua en la tabla users
      const oldUserQuery = "SELECT image FROM users WHERE id = $1";
      const oldUserResult = await pool.query(oldUserQuery, [userIdNum]);
      const oldImageUrl = oldUserResult.rows[0]?.image;

      // 2. Verificamos que tenga imagen vieja y que NO sea una de Google
      if (oldImageUrl && !oldImageUrl.includes("googleusercontent")) {
        // 3. Extraemos solo el nombre del archivo final (ej: foto.jpg)
        const fileName = oldImageUrl.split("/").pop();

        if (fileName) {
          // 🔥 CORRECCIÓN: S3 necesita el Key completo (Carpeta + Nombre del archivo)
          // Reconstruimos el camino exacto apuntando a tu carpeta "avatars"
          const oldImageKey = `avatars/${fileName}`;

          // 4. Borramos la foto antigua de tu S3 de forma segura
          await deleteFileFromS3Action(oldImageKey);
        }
      }
    }

    const {
      name,
      document_type,
      document_number,
      phone,
      address,
      city,
      country,
      birth_date,
      gender,
      blood_type,
      tshirt_size,
      emergency_contact,
      emergency_phone,
    } = validatedFields.data;

    // 🔥 2. ACTUALIZAMOS EL USUARIO PRINCIPAL (Ahora incluimos la imagen si hay una nueva)
    if (newImageUrl) {
      // Si subió foto nueva, actualizamos nombre y foto
      const updateUserQuery = `UPDATE users SET name = $1, image = $2 WHERE id = $3`;
      await pool.query(updateUserQuery, [name, newImageUrl, userIdNum]);
    } else if (name) {
      // Si no subió foto, solo actualizamos el nombre
      const updateUserQuery = `UPDATE users SET name = $1 WHERE id = $2`;
      await pool.query(updateUserQuery, [name, userIdNum]);
    }

    // 3. ACTUALIZAMOS EL PERFIL DEPORTIVO/MÉDICO
    const upsertProfileQuery = `
      INSERT INTO user_profiles (
        user_id, document_type, document_number, phone, address, city, country, 
        birth_date, gender, blood_type, tshirt_size, emergency_contact, emergency_phone, updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        document_type = EXCLUDED.document_type,
        document_number = EXCLUDED.document_number,
        phone = EXCLUDED.phone,
        address = EXCLUDED.address,
        city = EXCLUDED.city,
        country = EXCLUDED.country,
        birth_date = EXCLUDED.birth_date,
        gender = EXCLUDED.gender,
        blood_type = EXCLUDED.blood_type,
        tshirt_size = EXCLUDED.tshirt_size,
        emergency_contact = EXCLUDED.emergency_contact,
        emergency_phone = EXCLUDED.emergency_phone,
        updated_at = NOW()
    `;

    await pool.query(upsertProfileQuery, [
      userIdNum,
      document_type,
      document_number || null,
      phone || null,
      address || null,
      city || null,
      country,
      birth_date ? new Date(birth_date) : null,
      gender || null,
      blood_type || null,
      tshirt_size || null,
      emergency_contact || null,
      emergency_phone || null,
    ]);

    revalidatePath("/dashboard/account");
    return {
      success: true,
      message: "Perfil actualizado con éxito",
      data: fields,
    };
  } catch (error: any) {
    console.error("❌ Error en updateProfileAction:", error.message);
    return {
      success: false,
      message: error.message || "Error al actualizar.",
      data: fields,
    };
  }
}

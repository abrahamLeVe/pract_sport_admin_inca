"use server";

import pool from "@/lib/db";
import { EditUserSchema } from "@/validations/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z from "zod";

export async function updateUserAction(prevState: any, formData: FormData) {
  const fields = Object.fromEntries(formData.entries());

  const validatedFields = EditUserSchema.safeParse(fields);

  if (!validatedFields.success) {
    const flattenedErrors = z.flattenError(validatedFields.error);
    return {
      success: false,
      message: "Por favor, corrige los errores del formulario.",
      zodErrors: flattenedErrors.fieldErrors,
      data: fields,
    };
  }

  const { id, name, email, role, status, password } = validatedFields.data;

  try {
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, id],
    );
    if (emailCheck.rows.length > 0) {
      return {
        success: false,
        message: "El correo electrónico ya está registrado por otro usuario.",
        zodErrors: null,
        data: fields,
      };
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const updateWithPasswordQuery = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, password = $5, updated_at = NOW()
        WHERE id = $6
      `;
      await pool.query(updateWithPasswordQuery, [
        name,
        email,
        role,
        status,
        hashedPassword,
        id,
      ]);
    } else {
      const updateWithoutPasswordQuery = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, updated_at = NOW()
        WHERE id = $5
      `;
      await pool.query(updateWithoutPasswordQuery, [
        name,
        email,
        role,
        status,
        id,
      ]);
    }

    revalidatePath("/dashboard/users");
  } catch (error) {
    console.error("❌ Error al actualizar el usuario:", error);
    return {
      success: false,
      message:
        "Ocurrió un error inesperado en el servidor al guardar los cambios.",
      zodErrors: null,
      data: fields,
    };
  }

  redirect("/dashboard/users");
}

export async function toggleUserStatusAction(
  id: number,
  currentStatus: string,
) {
  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    const query = `
      UPDATE users 
      SET status = $1, updated_at = NOW() 
      WHERE id = $2
    `;
    await pool.query(query, [nextStatus, id]);

    revalidatePath("/dashboard/users");

    return {
      success: true,
      message: `Usuario ${nextStatus === "activo" ? "activado" : "desactivado"} correctamente.`,
    };
  } catch (error) {
    console.error("❌ Error en toggleUserStatusAction:", error);
    return {
      success: false,
      message: "No se pudo cambiar el estado del usuario.",
    };
  }
}

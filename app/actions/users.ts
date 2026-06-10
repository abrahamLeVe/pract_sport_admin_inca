"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { EditUserInput, EditUserSchema } from "@/validations/auth";
import { ActionState } from "@/validations/core";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function updateUserAction(
  prevState: ActionState<EditUserInput>,
  formData: FormData,
): Promise<ActionState<EditUserInput>> {
  await requireAdminSession();

  const rawId = formData.get("id")?.toString();
  const numericId = rawId ? parseInt(rawId, 10) : 0;

  const fields: EditUserInput = {
    id: numericId,
    name: formData.get("name")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    role: formData.get("role") as "SUPERADMIN" | "ADMIN" | "CLIENT",
    status: (formData.get("status") as "activo" | "inactivo") || "activo",
    password: formData.get("password")?.toString() || "",
  };

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

    if ((emailCheck.rowCount ?? 0) > 0) {
      return {
        success: false,
        message: "El correo electrónico ya está registrado por otro usuario.",
        zodErrors: { email: ["El correo ya existe."] },
        data: fields,
      };
    }

    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, password = $5, updated_at = NOW()
        WHERE id = $6
      `;
      await pool.query(query, [name, email, role, status, hashedPassword, id]);
    } else {
      const query = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, updated_at = NOW()
        WHERE id = $5
      `;
      await pool.query(query, [name, email, role, status, id]);
    }

    revalidatePath("/dashboard/users");
    return { success: true, message: "Usuario actualizado correctamente." };
  } catch (error: any) {
    console.error("❌ Error en updateUserAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error inesperado al guardar los cambios.",
      data: fields,
    };
  }
}

export async function toggleUserStatusAction(
  id: number,
  currentStatus: string,
): Promise<ActionState> {
  await requireAdminSession();
  const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

  try {
    const query = `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2`;
    await pool.query(query, [nextStatus, id]);

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: `Usuario ${nextStatus === "activo" ? "activado" : "desactivado"}.`,
    };
  } catch (error: any) {
    console.error("❌ Error en toggleUserStatusAction:", error.message);
    return {
      success: false,
      message: "No se pudo cambiar el estado del usuario.",
    };
  }
}

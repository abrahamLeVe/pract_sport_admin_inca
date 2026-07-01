"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
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
  const session = await requireAdminSession(); // 🔥 1. Capturamos la sesión para la auditoría

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

  try {
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

    // 🔥 2. Validamos el correo asegurándonos de ignorar usuarios en la papelera
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2 AND deleted_at IS NULL",
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

    let result;

    // 🔥 3. Actualizamos añadiendo la regla "AND deleted_at IS NULL"
    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, password = $5, updated_at = NOW()
        WHERE id = $6 AND deleted_at IS NULL
      `;
      result = await pool.query(query, [
        name,
        email,
        role,
        status,
        hashedPassword,
        id,
      ]);
    } else {
      const query = `
        UPDATE users 
        SET name = $1, email = $2, role = $3, status = $4, updated_at = NOW()
        WHERE id = $5 AND deleted_at IS NULL
      `;
      result = await pool.query(query, [name, email, role, status, id]);
    }

    // 🔥 4. Validación uniforme de la papelera
    if (result.rowCount === 0) {
      return {
        success: false,
        message:
          "No se pudo actualizar porque el usuario no existe o está eliminado.",
        data: fields,
      };
    }

    // 🔥 5. Auditoría uniforme (¡Sin guardar el password en los logs por seguridad!)
    await logAudit(session.user.id, "UPDATE", "users", id, null, {
      name,
      email,
      role,
      status,
    });

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
  const session = await requireAdminSession(); // 🔥 1. Capturamos la sesión

  try {
    const nextStatus = currentStatus === "activo" ? "inactivo" : "activo";

    // 🔥 2. Añadimos barrera de papelera
    const query = `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 AND deleted_at IS NULL`;
    const result = await pool.query(query, [nextStatus, id]);

    // 🔥 3. Validación uniforme
    if (result.rowCount === 0) {
      return {
        success: false,
        message:
          "No se pudo cambiar el estado porque el usuario no existe o está eliminado.",
      };
    }

    // 🔥 4. Auditoría uniforme
    await logAudit(session.user.id, "UPDATE", "users", id, null, {
      status: nextStatus,
    });

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: `Usuario ${nextStatus === "activo" ? "activado" : "desactivado"} correctamente.`,
    };
  } catch (error: any) {
    console.error("❌ Error en toggleUserStatusAction:", error.message);
    return {
      success: false,
      message: "No se pudo cambiar el estado del usuario.",
    };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteUserAction(id: number) {
  const session = await requireAdminSession();
  try {
    const query = "UPDATE users SET deleted_at = NOW() WHERE id = $1";
    await pool.query(query, [id]);

    // Guardamos qué administrador mandó al usuario a la papelera
    await logAudit(session.user.id, "SOFT_DELETE", "users", id);

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: "Usuario enviado a la papelera de reciclaje.",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteUserAction:", error.message);
    return {
      success: false,
      message: "No se pudo enviar el usuario a la papelera.",
    };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteUserAction(id: number) {
  const session = await requireAdminSession();
  try {
    const deleteQuery = "DELETE FROM users WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    // Auditoría del borrado permanente
    await logAudit(session.user.id, "HARD_DELETE", "users", id);

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: "Usuario eliminado definitivamente del sistema.",
    };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteUserAction:", error.message);

    // Capturamos el error por si el usuario tiene pedidos o inscripciones asociadas
    if (error.code === "23503") {
      return {
        success: false,
        message:
          "No se puede purgar este usuario porque tiene un historial de compras o inscripciones activo. Se recomienda mantenerlo solo en la papelera.",
      };
    }
    return {
      success: false,
      message: "No se pudo eliminar permanentemente al usuario.",
    };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteUsersAction(ids: number[]) {
  const session = await requireAdminSession();
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay usuarios seleccionados." };
    }

    const query = "UPDATE users SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    // Guardamos los IDs de los usuarios afectados en la auditoría
    await logAudit(session.user.id, "BULK_SOFT_DELETE", "users", ids.join(","));

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: `${ids.length} usuarios enviados a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteUsersAction:", error.message);
    return {
      success: false,
      message: "Error al enviar los usuarios seleccionados a la papelera.",
    };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteUsersAction(ids: number[]) {
  const session = await requireAdminSession();
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay usuarios seleccionados." };
    }

    const query = "DELETE FROM users WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    // Auditoría del borrado destructivo masivo
    await logAudit(session.user.id, "BULK_HARD_DELETE", "users", ids.join(","));

    revalidatePath("/dashboard/users");
    return {
      success: true,
      message: "Los usuarios seleccionados se eliminaron permanentemente.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteUsersAction:",
      error.message,
    );

    if (error.code === "23503") {
      return {
        success: false,
        message:
          "No se pudieron purgar algunos usuarios seleccionados porque tienen transacciones o registros enlazados.",
      };
    }
    return {
      success: false,
      message: "Error al purgar los usuarios seleccionados.",
    };
  }
}

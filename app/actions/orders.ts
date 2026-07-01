"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import { logAudit } from "@/lib/data/audit";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  UpdateOrderStatusInput,
  updateOrderStatusSchema,
} from "@/validations/orders";
import { revalidatePath } from "next/cache";
import z from "zod";
const REVALIDATE_ROUTE = "/dashboard/orders";

export async function updateOrderStatusAction(
  prevState: ActionState<UpdateOrderStatusInput>,
  formData: FormData,
): Promise<ActionState<UpdateOrderStatusInput>> {
  const session = await requireAdminSession(); // 🔥 1. Capturamos la sesión

  const fields = {
    id: formData.get("id"),
    order_status: formData.get("order_status"),
    payment_status: formData.get("payment_status"),
    notes: formData.get("notes"),
  };

  try {
    const validatedFields = updateOrderStatusSchema.safeParse(fields);

    if (!validatedFields.success) {
      const flattenedErrors = z.flattenError(validatedFields.error);
      return {
        success: false,
        message: "Por favor, verifica los campos del formulario.",
        zodErrors: flattenedErrors.fieldErrors,
        data: fields as any,
      };
    }

    const { id, order_status, payment_status, notes } = validatedFields.data;

    const query = `
      UPDATE orders 
      SET order_status = $1, 
          payment_status = $2, 
          notes = $3, 
          updated_at = NOW() 
      WHERE id = $4 AND deleted_at IS NULL
    `;

    const result = await pool.query(query, [
      order_status,
      payment_status || "pendiente",
      notes || null,
      id,
    ]);

    // 🔥 Validación uniforme: Rechaza si no existe o si está en la papelera
    if (result.rowCount === 0) {
      return {
        success: false,
        message:
          "No se pudo actualizar porque el pedido no existe o está eliminado.",
        data: fields as any,
      };
    }

    // 📋 AUDITORÍA UNIFORME
    await logAudit(
      session.user.id,
      "UPDATE",
      "orders",
      id,
      null,
      validatedFields.data,
    );

    revalidatePath(REVALIDATE_ROUTE);
    revalidatePath(`${REVALIDATE_ROUTE}/${id}`);

    return {
      success: true,
      message: "Estado del pedido actualizado correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en updateOrderStatusAction:", error.message);
    return {
      success: false,
      message: "Ocurrió un error en el servidor al actualizar el pedido.",
      data: fields as any,
    };
  }
}

// ============================================================================
// 1. ELIMINACIÓN INDIVIDUAL: ENVIAR A LA PAPELERA (Soft Delete)
// ============================================================================
export async function deleteOrderAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // Ocultamos el pedido de las estadísticas y del panel principal
    const softDeleteQuery =
      "UPDATE orders SET deleted_at = NOW() WHERE id = $1";
    await pool.query(softDeleteQuery, [id]);

    await logAudit(adminId, "SOFT_DELETE", "orders", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Pedido movido a la papelera correctamente.",
    };
  } catch (error: any) {
    console.error("❌ Error en deleteOrderAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo mover el pedido a la papelera.",
    };
  }
}

// ============================================================================
// 2. ELIMINACIÓN INDIVIDUAL: PURGAR DEFINITIVAMENTE (Hard Delete)
// ============================================================================
export async function permanentlyDeleteOrderAction(id: number) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    // Borrado destructivo de la base de datos (PostgreSQL borrará en cascada los order_items si lo configuraste así)
    const deleteQuery = "DELETE FROM orders WHERE id = $1";
    await pool.query(deleteQuery, [id]);

    await logAudit(adminId, "HARD_DELETE", "orders", id);

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Pedido eliminado definitivamente del sistema.",
    };
  } catch (error: any) {
    console.error("❌ Error en permanentlyDeleteOrderAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudo purgar el pedido. Verifica si tiene pagos asociados bloqueando la acción.",
    };
  }
}

// ============================================================================
// 3. ELIMINACIÓN MASIVA: ENVIAR SELECCIONADOS A LA PAPELERA (Bulk Soft Delete)
// ============================================================================
export async function bulkDeleteOrdersAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay pedidos seleccionados." };
    }

    // Ocultamos todo el lote de pedidos de prueba o spam de un solo golpe
    const query = "UPDATE orders SET deleted_at = NOW() WHERE id = ANY($1)";
    await pool.query(query, [ids]);

    await logAudit(adminId, "BULK_SOFT_DELETE", "orders", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: `${ids.length} pedidos movidos a la papelera.`,
    };
  } catch (error: any) {
    console.error("❌ Error en bulkDeleteOrdersAction:", error.message);
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "Error al eliminar los pedidos seleccionados.",
    };
  }
}

// ============================================================================
// 4. ELIMINACIÓN MASIVA: PURGAR SELECCIONADOS DEFINITIVAMENTE (Bulk Hard Delete)
// ============================================================================
export async function bulkPermanentlyDeleteOrdersAction(ids: number[]) {
  try {
    const session = await requireAdminSession();
    const adminId = session.user.id;

    if (!ids || ids.length === 0) {
      return { success: false, message: "No hay pedidos seleccionados." };
    }

    // Eliminación física masiva en la base de datos
    const deleteQuery = "DELETE FROM orders WHERE id = ANY($1)";
    await pool.query(deleteQuery, [ids]);

    await logAudit(adminId, "BULK_HARD_DELETE", "orders", ids.join(","));

    revalidatePath(REVALIDATE_ROUTE);
    return {
      success: true,
      message: "Los pedidos seleccionados se eliminaron permanentemente.",
    };
  } catch (error: any) {
    console.error(
      "❌ Error en bulkPermanentlyDeleteOrdersAction:",
      error.message,
    );
    return {
      success: false,
      message: error.message.includes("No autorizado")
        ? error.message
        : "No se pudieron purgar los pedidos seleccionados.",
    };
  }
}

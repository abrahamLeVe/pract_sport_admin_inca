"use server";

import { requireAdminSession } from "@/lib/auth-guard";
import pool from "@/lib/db";
import { ActionState } from "@/validations/core";
import {
  UpdateOrderStatusInput,
  updateOrderStatusSchema,
} from "@/validations/orders";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function updateOrderStatusAction(
  prevState: ActionState<UpdateOrderStatusInput>,
  formData: FormData,
): Promise<ActionState<UpdateOrderStatusInput>> {
  await requireAdminSession();

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
      WHERE id = $4
    `;

    await pool.query(query, [
      order_status,
      payment_status || "pendiente",
      notes || null,
      id,
    ]);

    revalidatePath("/dashboard/orders");
    revalidatePath(`/dashboard/orders/${id}`);

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

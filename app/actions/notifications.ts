"use server";
import { getNotificationList } from "@/lib/data/notifications";
import pool from "@/lib/db";
import { revalidateTag } from "next/cache";

// Esta función será llamada por SWR
export async function getNotificationsAction() {
  return await getNotificationList();
}

export async function markAsRead(id: string) {
  await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [
    id,
  ]);
  revalidateTag("notifications", { expire: 0 }); // Esto limpia la caché
  return { success: true };
}

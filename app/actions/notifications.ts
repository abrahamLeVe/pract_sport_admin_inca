"use server";

import { Notification } from "@/components/notification-bell";
import pool from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNotificationList(): Promise<Notification[]> {
  const res = await pool.query(`
    SELECT * FROM notifications WHERE is_read = FALSE ORDER BY created_at DESC
  `);
  return res.rows;
}

export async function markAsRead(notificationId: string) {
  await pool.query(
    `
    UPDATE notifications 
    SET is_read = TRUE 
    WHERE id = $1
  `,
    [notificationId],
  );

  // Esto ayuda a SWR a saber que algo cambió
  revalidatePath("/dashboard");
}

import { unstable_cache } from "next/cache";
import pool from "@/lib/db";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  reference_id: string;
  is_read: boolean;
  created_at: string;
}

export const getNotificationList = unstable_cache(
  async () => {
    const res = await pool.query(`
      SELECT *, created_at::text as created_at 
      FROM notifications 
      WHERE is_read = FALSE 
      ORDER BY notifications.created_at DESC
    `);

    return res.rows as Notification[];
  },
  ["notifications"],
  { tags: ["notifications"], revalidate: 30 },
);

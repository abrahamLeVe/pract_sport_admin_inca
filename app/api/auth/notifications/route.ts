// app/api/notifications/route.ts
import { getNotificationList } from "@/lib/data/notifications";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const notifications = await getNotificationList();
    return NextResponse.json(notifications);
  } catch (error) {
    return NextResponse.json({ error: "Error fetching" }, { status: 500 });
  }
}

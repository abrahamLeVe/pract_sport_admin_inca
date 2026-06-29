"use server";
import { getDashboardData } from "@/lib/data/dashboard";

export async function fetchDashboardDataAction(days: number = 30) {
  return await getDashboardData(days);
}

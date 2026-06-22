"use server";

import { getInventoryReportData } from "@/lib/data/inventory-report";
import { getAdvancedReportData } from "@/lib/data/reports";

export async function downloadReportAction(days: number) {
  try {
    const data = await getAdvancedReportData(days);
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      error: "Hubo un error al generar los datos del reporte.",
    };
  }
}

export async function downloadInventoryAction() {
  try {
    const data = await getInventoryReportData();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Hubo un error al generar el inventario." };
  }
}

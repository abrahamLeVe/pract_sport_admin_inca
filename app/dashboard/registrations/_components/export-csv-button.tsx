"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { exportEventCsvAction } from "@/app/actions/registrations"; // Ajusta la ruta si es necesario
import { exportToCsv } from "@/lib/utils"; // 🔥 Usando TU función existente

interface ExportCsvButtonProps {
  eventId: number;
}

export function ExportCsvButton({ eventId }: ExportCsvButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const result = await exportEventCsvAction(eventId);

      if (result.success && result.data) {
        // Le pasamos el nombre del archivo y la data a tu utilitario
        exportToCsv(`Inscritos_Evento_${eventId}.csv`, result.data);
        toast.success("Excel generado correctamente.");
      } else {
        toast.error(result.message || "Error al obtener datos.");
      }
    } catch (error) {
      toast.error("Ocurrió un error al procesar la solicitud.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="border-green-600 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-500 dark:hover:bg-green-900/20"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Generando..." : "Exportar Excel"}
    </Button>
  );
}

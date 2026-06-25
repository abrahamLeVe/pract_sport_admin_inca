"use client";

import { downloadReportAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ExportReportButtonProps {
  days: number;
}

export function ExportReportButton({ days }: ExportReportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generando reporte completo...");

    try {
      const response = await downloadReportAction(days);

      if (!response.success || !response.data) {
        throw new Error(response.error);
      }

      const { data } = response;
      const doc = new jsPDF("p", "mm", "a4");

      // 1. Cabecera
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Reporte Integral de Operaciones", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Periodo analizado: ${data.period}`, 14, 30);
      doc.text(`Generado el: ${new Date().toLocaleString("es-PE")}`, 14, 35);

      // 2. Resumen Financiero
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("1. Resumen Financiero", 14, 45);

      autoTable(doc, {
        startY: 50,
        head: [
          [
            "Ingresos Reales",
            "Total Intentos",
            "Pedidos Exitosos",
            "Ticket Promedio",
          ],
        ],
        body: [
          [
            `S/ ${data.summary.totalRevenue.toFixed(2)}`,
            data.summary.totalOrders.toString(),
            data.summary.paidOrders.toString(),
            `S/ ${data.summary.avgTicket.toFixed(2)}`,
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
      });

      // 3. Distribución de Estados (El Dinero en la Mesa)
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("2. Estado de Todos los Pedidos", 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          ["Estado del Pago", "Cantidad de Pedidos", "Dinero Involucrado"],
        ],
        body: data.statusDistribution.map((s) => [
          s.status,
          s.count.toString(),
          `S/ ${s.total.toFixed(2)}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [230, 126, 34] }, // Color Naranja para destacar
      });

      // 4. Productos y Clientes Top
      finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("3. Top Productos (Pagados)", 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [["Producto", "Vendidos", "Ingresos"]],
        body: data.topProducts.map((p) => [
          p.name,
          p.sold.toString(),
          `S/ ${p.revenue.toFixed(2)}`,
        ]),
        theme: "striped",
        headStyles: { fillColor: [44, 62, 80] },
      });

      // 5. Desglose detallado de Órdenes (TODAS LAS ÓRDENES)
      doc.addPage();
      doc.setFontSize(14);
      doc.text("4. Auditoría de Transacciones (Historial Completo)", 14, 20);

      autoTable(doc, {
        startY: 25,
        head: [["N° Orden", "Fecha", "Cliente", "Método", "Estado", "Total"]],
        body: data.detailedOrders.map((o) => [
          o.orderNumber,
          o.date,
          o.customer,
          o.method.toUpperCase(),
          o.status.toUpperCase(), // Mostramos el estado
          `S/ ${o.total.toFixed(2)}`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [41, 128, 185] },
        styles: { fontSize: 8 },
        // Pintar de rojo si falló o amarillo si está pendiente
        willDrawCell: function (data) {
          if (data.section === "body" && data.column.index === 4) {
            if (
              data.cell.raw === "FALLIDO" ||
              data.cell.raw === "REEMBOLSADO"
            ) {
              doc.setTextColor(231, 76, 60); // Rojo
            } else if (data.cell.raw === "PENDIENTE") {
              doc.setTextColor(241, 196, 15); // Amarillo oscuro
            } else if (data.cell.raw === "PAGADO") {
              doc.setTextColor(46, 204, 113); // Verde
            }
          }
        },
      });

      doc.save(`Auditoria_Completa_${days}_dias_${new Date().getTime()}.pdf`);
      toast.success("¡Reporte completo descargado!", { id: toastId });
    } catch (error) {
      toast.error("Ocurrió un error al generar el PDF.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="outline"
      className="bg-background"
    >
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileText className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Generando PDF..." : "Exportar Reporte"}
    </Button>
  );
}

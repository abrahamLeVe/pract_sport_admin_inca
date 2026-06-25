"use client";

import { downloadInventoryAction } from "@/app/actions/reports";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Loader2, PackageSearch } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ExportInventoryButton() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generando reporte maestro...");

    try {
      const response = await downloadInventoryAction();

      if (!response.success || !response.data) {
        throw new Error(response.error);
      }

      const { data } = response;
      const doc = new jsPDF("p", "mm", "a4");

      // ==========================================
      // PÁGINA 1: RESUMEN Y STOCK DE PRODUCTOS
      // ==========================================
      doc.setFontSize(20);
      doc.setTextColor(40, 40, 40);
      doc.text("Catálogo e Inventario Maestro", 14, 22);

      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Fecha de emisión: ${new Date().toLocaleString("es-PE")}`,
        14,
        30,
      );

      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text("1. Resumen Físico", 14, 45);

      autoTable(doc, {
        startY: 50,
        head: [
          [
            "Productos Únicos",
            "Total Variantes",
            "Unidades Físicas (Stock)",
            "Alerta: Sin Stock",
          ],
        ],
        body: [
          [
            data.summary.totalProducts.toString(),
            data.summary.totalVariants.toString(),
            data.summary.totalStockUnits.toString(),
            data.summary.outOfStock.toString(),
          ],
        ],
        theme: "grid",
        headStyles: { fillColor: [39, 174, 96] },
      });

      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("2. Inventario Detallado por SKU", 14, finalY);

      autoTable(doc, {
        startY: finalY + 5,
        head: [
          [
            "SKU",
            "Producto",
            "Marca / Cat.",
            "Talla",
            "Color",
            "Estado",
            "Stock",
          ],
        ],
        body: data.items.map((i) => [
          i.sku,
          i.productName,
          `${i.brand} / ${i.category}`,
          i.size,
          i.color,
          i.status,
          i.stock.toString(),
        ]),
        theme: "grid",
        headStyles: { fillColor: [44, 62, 80] },
        styles: { fontSize: 8 },
        willDrawCell: function (data) {
          if (data.section === "body") {
            if (data.column.index === 6 && data.cell.raw === "0") {
              doc.setTextColor(231, 76, 60); // Rojo si no hay stock
              doc.setFont("helvetica", "bold");
            }
            if (data.column.index === 5 && data.cell.raw === "INACTIVO") {
              doc.setTextColor(149, 165, 166); // Gris si está inactivo
            }
          }
        },
      });

      // ==========================================
      // PÁGINA 2: DATOS MAESTROS Y CONFIGURACIÓN
      // ==========================================
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text("3. Configuraciones del Catálogo", 14, 20);

      // Tabla de Marcas
      doc.setFontSize(12);
      doc.text("Marcas Registradas", 14, 30);
      autoTable(doc, {
        startY: 35,
        head: [["Nombre de la Marca", "Estado en Tienda"]],
        body: data.masterData.brands.map((b) => [
          b.name,
          b.status.toUpperCase(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [142, 68, 173] }, // Morado
        margin: { right: 110 }, // La hacemos más angosta (mitad de página)
      });

      // Tabla de Categorías (Al lado de Marcas si se puede, o abajo)
      let currentY = (doc as any).lastAutoTable.finalY + 10;
      doc.text("Categorías Registradas", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Nombre de la Categoría", "Estado en Tienda"]],
        body: data.masterData.categories.map((c) => [
          c.name,
          c.status.toUpperCase(),
        ]),
        theme: "striped",
        headStyles: { fillColor: [41, 128, 185] }, // Azul
        margin: { right: 110 },
      });

      // Verificamos si hay que hacer salto de página para colores y tallas
      currentY = (doc as any).lastAutoTable.finalY + 10;
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      // Tabla de Colores
      doc.text("Colores Maestros", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Color", "Código HEX"]],
        body: data.masterData.colors.map((c) => [c.name, c.hex]),
        theme: "striped",
        headStyles: { fillColor: [22, 160, 133] }, // Verde agua
        margin: { right: 110 },
      });

      // Tabla de Tallas
      currentY = (doc as any).lastAutoTable.finalY + 10;
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.text("Tallas Maestras", 14, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Nombre de la Talla", "Aplica a"]],
        body: data.masterData.sizes.map((s) => [s.name, s.category]),
        theme: "striped",
        headStyles: { fillColor: [211, 84, 0] }, // Naranja
        margin: { right: 110 },
      });

      doc.save(`Catalogo_Maestro_${new Date().getTime()}.pdf`);
      toast.success("¡Catálogo Maestro descargado!", { id: toastId });
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
        <PackageSearch className="mr-2 h-4 w-4" />
      )}
      {isExporting ? "Procesando..." : "Descargar Catálogo Maestro"}
    </Button>
  );
}

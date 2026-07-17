import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize("NFD") // Separa las letras de las tildes (ej. á -> a + ´)
    .replace(/[\u0300-\u036f]/g, "") // Elimina las tildes
    .replace(/\s+/g, "-") // Reemplaza espacios por guiones
    .replace(/[^\w\-]+/g, "") // Elimina caracteres que no sean palabras o guiones
    .replace(/\-\-+/g, "-") // Reemplaza múltiples guiones por uno solo
    .replace(/^-+/, "") // Quita guiones al principio
    .replace(/-+$/, ""); // Quita guiones al final
};

export function formatCurrency(
  amount: number | string | null | undefined,
): string {
  // 1. Manejo de valores vacíos o nulos
  if (amount === null || amount === undefined || amount === "") {
    return "S/ 0.00";
  }

  // 2. Conversión segura a número
  const numericAmount =
    typeof amount === "string" ? parseFloat(amount) : amount;

  // 3. Validación de seguridad (por si el string no era un número válido, ej: "abc")
  if (isNaN(numericAmount)) {
    return "S/ 0.00";
  }

  // 4. Formateo
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(numericAmount);
}

export const formatDateTimeLocal = (
  dateInput: string | Date | null | undefined,
): string => {
  if (!dateInput) return "";

  const date = new Date(dateInput);

  // Verificación por si la fecha es inválida
  if (isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const formatDateDisplay = (
  dateInput: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" },
): string => {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  // Aplicamos el ajuste de zona horaria que ya usabas
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset());

  return date.toLocaleDateString("es-PE", options);
};

export const getCleanFileNameFromUrl = (url: string) => {
  try {
    let fileName = url.split("/").pop()?.split("?")[0] || "Imagen";
    // Elimina la serie de números al inicio (ej. "1783561870549-")
    fileName = fileName.replace(/^\d+-/, "");
    return fileName;
  } catch {
    return "Imagen";
  }
};

export const formatAuditDate = (
  dateInput: string | Date | null | undefined,
): string => {
  if (!dateInput) return "";

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
};

export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;

  const separator = ",";
  const keys = Object.keys(rows[0]);

  const csvContent =
    keys.join(separator) +
    "\n" +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            // 1. Obtenemos el valor crudo sin mutarlo
            const rawValue = row[k];
            let cellString = "";

            // 2. Verificamos que no sea nulo ni indefinido
            if (rawValue !== null && rawValue !== undefined) {
              // 3. Ahora sí podemos usar instanceof de forma segura
              if (rawValue instanceof Date) {
                cellString = rawValue.toLocaleString();
              } else {
                // Convertimos a string de forma segura y escapamos comillas
                cellString = String(rawValue).replace(/"/g, '""');
              }
            }

            // 4. Escapar celdas que contienen comas, comillas o saltos de línea
            if (cellString.search(/("|,|\n)/g) >= 0) {
              cellString = `"${cellString}"`;
            }

            return cellString;
          })
          .join(separator);
      })
      .join("\n");

  // El prefijo \ufeff fuerza a Excel a leer el archivo en UTF-8 (para tildes y ñ)
  const blob = new Blob([`\ufeff${csvContent}`], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

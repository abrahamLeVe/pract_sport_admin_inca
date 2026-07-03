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

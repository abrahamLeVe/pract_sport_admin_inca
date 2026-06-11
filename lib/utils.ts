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

import { auth } from "@/auth";
import { redirect } from "next/navigation";

// Guardia actual (Deja pasar ADMIN y SUPERADMIN)
export async function requireAdminSession() {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  if (session.user.role !== "SUPERADMIN" && session.user.role !== "ADMIN") {
    redirect("/dashboard"); // O a una página de "No autorizado"
  }

  return session;
}

// 🔥 NUEVO GUARDIA: Solo SUPERADMIN (Para purgas y borrados físicos)
export async function requireSuperAdminSession() {
  const session = await auth();
  if (!session || !session.user) redirect("/login");

  if (session.user.role !== "SUPERADMIN") {
    // Lanzamos un error que los Server Actions pueden capturar
    throw new Error(
      "Acceso denegado: Se requieren privilegios de SUPERADMIN para esta acción destructiva.",
    );
  }

  return session;
}

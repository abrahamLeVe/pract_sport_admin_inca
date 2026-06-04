import { auth } from "@/auth";

export async function requireAdminSession() {
  const session = await auth();

  // 1. Validamos que exista una sesión activa
  if (!session || !session.user) {
    throw new Error("No autorizado: Debes iniciar sesión.");
  }

  // 2. Validamos que el rol tenga privilegios administrativos
  const userRole = session.user.role;
  if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
    throw new Error("No autorizado: Permisos administrativos insuficientes.");
  }

  return session;
}

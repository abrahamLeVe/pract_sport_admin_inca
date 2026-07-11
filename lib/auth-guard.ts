import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAdminSession() {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/?error=SessionExpired");
  }

  const userRole = session.user.role;
  if (userRole !== "SUPERADMIN" && userRole !== "ADMIN") {
    redirect("/?error=Unauthorized");
  }

  return session;
}

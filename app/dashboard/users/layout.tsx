import { auth } from "@/auth";
import { redirect } from "next/navigation";

interface UsersLayoutProps {
  children: React.ReactNode;
}

export default async function UsersLayout({ children }: UsersLayoutProps) {
  const session = await auth();

  if (!session || session.user?.role !== "SUPERADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

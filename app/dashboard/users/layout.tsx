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

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-center ">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de Usuarios
        </h1>
      </div>

      {children}
    </div>
  );
}

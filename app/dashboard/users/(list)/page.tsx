import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUsers } from "@/lib/data/users";
import { Plus } from "lucide-react";
import Link from "next/link";
import { UsersClient } from "../_components/users-client";

export const metadata = {
  title: "Usuarios | Admin Inca",
};

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Gestión de Usuarios
        </h1>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Administración de Cuentas</CardTitle>
          <CardDescription>
            Administra a los miembros de tu equipo (administradores) y visualiza
            a los clientes registrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UsersClient data={users} />
        </CardContent>
      </Card>
    </div>
  );
}

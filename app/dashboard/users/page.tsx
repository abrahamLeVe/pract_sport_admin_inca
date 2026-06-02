import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

import { SearchUsers } from "./_components/search-users";
import { PaginationUsers } from "./_components/pagination-users";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getUsersAction } from "@/lib/data/users";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    page?: string;
  }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query || "";
  const page = Number(params.page) || 1;

  const { users, totalPages } = await getUsersAction({ query, page, limit: 5 });

  return (
    <div className="w-full space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de Usuarios
        </h1>
        <Button asChild>
          <Link href="/dashboard/users/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Link>
        </Button>
      </div>

      <div className="flex items-center py-2">
        <SearchUsers />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo Electrónico</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Fecha Registro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.id}</TableCell>
                  <TableCell>{user.name || "Sin nombre"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === "SUPERADMIN" ? "destructive" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.status === "activo" ? "default" : "outline"}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(user.created_at).toLocaleDateString("es-PE")}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron usuarios registrados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <PaginationUsers totalPages={totalPages} />
    </div>
  );
}

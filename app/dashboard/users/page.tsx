import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getUsersAction } from "@/lib/data/users";
import { Edit2, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { PaginationUsers } from "./_components/pagination-users";
import { SearchUsers } from "./_components/search-users";
import { DeleteUserButton } from "./_components/delete-user-button";

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
              <TableHead className="w-12 text-center">Acciones</TableHead>
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

                  {/* 2. Menú Desplegable de Acciones por cada Fila */}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-40 rounded-xl"
                      >
                        <DropdownMenuLabel>Opciones</DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {/* Opción Editar: Te redirige a la subruta con el ID del usuario */}
                        <DropdownMenuItem
                          asChild
                          className="cursor-pointer rounded-lg gap-2"
                        >
                          <Link href={`/dashboard/users/edit/${user.id}`}>
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Editar</span>
                          </Link>
                        </DropdownMenuItem>

                        {/* Opción Eliminar (Desactivar de forma lógica) */}
                        <DeleteUserButton
                          userId={user.id}
                          userName={user.name || "este usuario"}
                          currentStatus={user.status} // <- Agregado aquí
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
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

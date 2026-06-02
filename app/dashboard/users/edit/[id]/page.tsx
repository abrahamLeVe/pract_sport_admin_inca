import { notFound } from "next/navigation";
import { getUserByIdAction } from "@/lib/data/users";
import { EditUserForm } from "@/app/dashboard/users/_components/edit-user-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id, 10);

  // 1. Control de seguridad por si manipulan la URL con texto en vez de números
  if (isNaN(userId)) {
    notFound();
  }

  // 2. Extraemos los datos frescos de la base de datos
  const user = await getUserByIdAction(userId);

  // 3. Si el ID no existe en la BD, disparamos la pantalla 404 nativa de Next.js
  if (!user) {
    notFound();
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Gestión de Usuarios
        </h1>
      </div>
      <div className="mt-4">
        {/* Renderizamos el formulario pasándole la información inicial */}
        <EditUserForm initialData={user} />
      </div>
    </div>
  );
}

import { RegisterUserForm } from "@/components/register-user-form";

export default function NewUserPage() {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:p-8 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Gestión de Usuarios
        </h1>
      </div>
      <div className="mt-4">
        <RegisterUserForm />
      </div>
    </div>
  );
}

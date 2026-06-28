import { notFound, redirect } from "next/navigation";
import { ProfileForm } from "./_components/profile-form";
import { auth } from "@/auth";
import pool from "@/lib/db"; // Importamos la DB para verificar si es OAuth
import { getUserProfileAction } from "@/lib/data/profile";

export const metadata = {
  title: "Mi Cuenta | Admin Inca",
};

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = parseInt(session.user.id, 10);

  if (isNaN(userId)) {
    notFound();
  }

  // Obtenemos los datos del perfil
  const profile = await getUserProfileAction(userId);

  // Verificamos si el usuario se registró con Google u otro proveedor OAuth
  const accountResult = await pool.query(
    `SELECT 1 FROM accounts WHERE "userId" = $1 LIMIT 1`,
    [userId],
  );
  const isOAuth = (accountResult.rowCount ?? 0) > 0;

  return (
    <ProfileForm
      userId={userId}
      initialData={profile || {}}
      isOAuth={isOAuth}
    />
  );
}

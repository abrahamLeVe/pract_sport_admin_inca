import { EditUserForm } from "@/app/dashboard/users/_components/edit-user-form";
import { getUserByIdAction } from "@/lib/data/users";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditUserPage({ params }: PageProps) {
  const resolvedParams = await params;
  const userId = parseInt(resolvedParams.id, 10);

  if (isNaN(userId)) {
    notFound();
  }

  const user = await getUserByIdAction(userId);

  if (!user) {
    notFound();
  }

  return <EditUserForm initialData={user} />;
}

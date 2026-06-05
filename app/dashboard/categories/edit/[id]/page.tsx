import { notFound } from "next/navigation";
import { getCategoryByIdAction } from "@/lib/data/categories";
import { EditCategoryForm } from "@/app/dashboard/categories/_components/edit-category-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const resolvedParams = await params;
  const categoryId = parseInt(resolvedParams.id, 10);

  if (isNaN(categoryId)) {
    notFound();
  }

  const category = await getCategoryByIdAction(categoryId);

  if (!category) {
    notFound();
  }

  return (
    <div className="p-4 lg:p-8">
      <EditCategoryForm initialData={category} />
    </div>
  );
}

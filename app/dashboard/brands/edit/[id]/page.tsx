import { getBrandByIdAction } from "@/lib/data/brands";
import { notFound } from "next/navigation";
import { EditBrandForm } from "../../_components/edit-brand-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBrandPage({ params }: PageProps) {
  const resolvedParams = await params;
  const brandId = parseInt(resolvedParams.id, 10);

  if (isNaN(brandId)) {
    notFound();
  }

  const brand = await getBrandByIdAction(brandId);

  if (!brand) {
    notFound();
  }

  return <EditBrandForm initialData={brand} />;
}

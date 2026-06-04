import { getBannerByIdAction } from "@/lib/data/banners";
import { notFound } from "next/navigation";
import { EditBannerForm } from "../../_components/edit-banner-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBannerPage({ params }: PageProps) {
  const resolvedParams = await params;
  const bannerId = parseInt(resolvedParams.id, 10);

  if (isNaN(bannerId)) {
    notFound();
  }

  // 🔥 Consumimos la función desde nuestra capa de datos (data layer)
  const banner = await getBannerByIdAction(bannerId);

  if (!banner) {
    notFound();
  }

  return (
    <div className="w-full space-y-4 p-6">
      <EditBannerForm initialData={banner} />
    </div>
  );
}

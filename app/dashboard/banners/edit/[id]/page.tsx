import { getBannerByIdAction } from "@/lib/data/banners";
import { notFound } from "next/navigation";
import { EditBannerForm } from "../../_components/edit-banner-form";
import { getIdsTitlesEventsAction } from "@/lib/data/events";

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

  const banner = await getBannerByIdAction(bannerId);
  const events = await getIdsTitlesEventsAction();
  if (!banner) {
    notFound();
  }

  return <EditBannerForm initialData={banner} events={events} />;
}

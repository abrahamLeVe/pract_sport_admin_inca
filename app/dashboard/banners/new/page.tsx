import { getIdsTitlesEventsAction } from "@/lib/data/events";
import { BannerForm } from "../_components/register-banner-form";

export default async function NewBannerPage() {
  const events = await getIdsTitlesEventsAction();
  return <BannerForm events={events} />;
}

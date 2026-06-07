import { getClubSettings } from "@/lib/data/settings";
import { ClubSettingsForm } from "./_components/club-settings-form";

export default async function SettingsPage() {
  const settings = await getClubSettings();

  return <ClubSettingsForm initialData={settings} />;
}

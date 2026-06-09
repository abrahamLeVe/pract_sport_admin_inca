import { RegisterEventForm } from "../_components/register-event-form";
import {
  getAllMasterEventTypesAction,
  getAllMasterDistancesAction,
  getAllMasterGendersAction,
  getAllMasterAgeCategoriesAction,
} from "@/lib/data/master-data";

export const metadata = {
  title: "Nuevo Evento | Dashboard",
};

export default async function NewEventPage() {
  // 🔥 Solicitamos los datos maestros en paralelo para no hacer lenta la carga
  const [eventTypes, distances, genders, ageCategories] = await Promise.all([
    getAllMasterEventTypesAction(),
    getAllMasterDistancesAction(),
    getAllMasterGendersAction(),
    getAllMasterAgeCategoriesAction(),
  ]);

  return (
    <div className="p-4 md:p-6 w-full">
      <RegisterEventForm
        eventTypes={eventTypes}
        distances={distances}
        genders={genders}
        ageCategories={ageCategories}
      />
    </div>
  );
}

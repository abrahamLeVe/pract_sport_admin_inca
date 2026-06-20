import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  getNextAvailableBib,
  getRegistrationById,
} from "@/lib/data/registrations";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EditRegistrationForm } from "../../_components/edit-registration-form";

export const metadata = {
  title: "Detalle de Inscripción | Admin Inca",
};

export default async function RegistrationDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const registrationId = parseInt(params.id, 10);

  if (isNaN(registrationId)) return notFound();

  const registration = await getRegistrationById(registrationId);
  if (!registration) return notFound();

  // 🔥 Calculamos cuál es el próximo número libre para este evento en particular
  const nextAvailableBib = await getNextAvailableBib(registration.event_id);

  const details = registration.participant_details;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/registrations">Inscripciones</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Detalle del Atleta</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Atleta: {details.firstName} {details.lastName}
        </h2>
      </div>

      {/* Le pasamos el número sugerido al formulario */}
      <EditRegistrationForm
        initialData={registration}
        nextAvailableBib={nextAvailableBib}
      />
    </div>
  );
}

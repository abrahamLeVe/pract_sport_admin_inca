import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllMasterAgeCategoriesAction,
  getAllMasterDistancesAction,
  getAllMasterEventTypesAction,
  getAllMasterGendersAction,
} from "@/lib/data/master-data";
import AgesTab from "./_components/ages-tab";
import DistancesTab from "./_components/distances-tab";
import EventTypesTab from "./_components/event-types-tab";
import GendersTab from "./_components/genders-tab";

export const metadata = {
  title: "Configuración de Competencias",
};

export default async function RaceSettingsPage() {
  const distances = await getAllMasterDistancesAction();
  const genders = await getAllMasterGendersAction();
  const ages = await getAllMasterAgeCategoriesAction();
  const eventTypes = await getAllMasterEventTypesAction();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Datos Maestros</h1>
        <p className="text-muted-foreground mt-2">
          Configura las distancias, géneros y categorías de edad que se usarán
          en todos los eventos.
        </p>
      </div>

      <Tabs defaultValue="distances" className="w-full h-auto">
        <TabsList className="grid w-full grid-cols-2 gap-2 mb-6 lg:grid-cols-4 p-2 h-auto!">
          <TabsTrigger value="distances">Distancias</TabsTrigger>
          <TabsTrigger value="genders">Géneros</TabsTrigger>
          <TabsTrigger value="ages">Categorías de Edad</TabsTrigger>
          <TabsTrigger value="event-types">Tipos de Evento</TabsTrigger>
        </TabsList>

        <TabsContent value="distances">
          <DistancesTab data={distances} />
        </TabsContent>

        <TabsContent value="genders">
          <GendersTab data={genders} />
        </TabsContent>

        <TabsContent value="ages">
          <AgesTab data={ages} />
        </TabsContent>

        <TabsContent value="event-types">
          <EventTypesTab data={eventTypes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

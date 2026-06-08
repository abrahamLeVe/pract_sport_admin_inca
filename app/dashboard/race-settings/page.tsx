import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllMasterDistancesAction,
  getAllMasterGendersAction,
  getAllMasterAgeCategoriesAction,
} from "@/lib/data/master-data";
import DistancesTab from "./_components/distances-tab";
import GendersTab from "./_components/genders-tab";
import AgesTab from "./_components/ages-tab";

export const metadata = {
  title: "Configuración de Competencias",
};

export default async function RaceSettingsPage() {
  const distances = await getAllMasterDistancesAction();
  const genders = await getAllMasterGendersAction();
  const ages = await getAllMasterAgeCategoriesAction();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Datos Maestros</h1>
        <p className="text-muted-foreground mt-2">
          Configura las distancias, géneros y categorías de edad que se usarán
          en todos los eventos.
        </p>
      </div>

      <Tabs defaultValue="distances" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="distances">Distancias</TabsTrigger>
          <TabsTrigger value="genders">Géneros</TabsTrigger>
          <TabsTrigger value="ages">Categorías de Edad</TabsTrigger>
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
      </Tabs>
    </div>
  );
}

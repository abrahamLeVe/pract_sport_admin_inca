import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllMasterColorsAction,
  getAllMasterSizesAction,
} from "@/lib/data/store-masters";
import { Suspense } from "react";
import ColorsTab from "./_components/colors-tab";
import SizesTab from "./_components/sizes-tab";
import TabRaceLoading from "./_components/tab-skeleton";

export const metadata = {
  title: "Configuración de variables de producto",
};

async function ColorsWrapper() {
  const colors = await getAllMasterColorsAction();
  return <ColorsTab data={colors} />;
}

async function SizesWrapper() {
  const sizes = await getAllMasterSizesAction();
  return <SizesTab data={sizes} />;
}

export default function RaceSettingsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Datos Maestros</h1>
        <p className="text-muted-foreground mt-2">
          Configura los colores y las medidas de producto que se usarán en la
          web.
        </p>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 p-2 h-auto!">
          <TabsTrigger
            value="colors"
            className="text-xs sm:text-sm whitespace-normal"
          >
            Colores
          </TabsTrigger>
          <TabsTrigger
            value="sizes"
            className="text-xs sm:text-sm whitespace-normal"
          >
            Medidas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <Suspense fallback={<TabRaceLoading />}>
            <ColorsWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="sizes">
          <Suspense fallback={<TabRaceLoading />}>
            <SizesWrapper />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

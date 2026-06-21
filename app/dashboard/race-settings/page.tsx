import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getAllMasterAgeCategoriesAction,
  getAllMasterDistancesAction,
  getAllMasterEventTypesAction,
  getAllMasterGendersAction,
} from "@/lib/data/master-data";
import { Suspense } from "react";
import AgesTab from "./_components/ages-tab";
import DistancesTab from "./_components/distances-tab";
import EventTypesTab from "./_components/event-types-tab";
import GendersTab from "./_components/genders-tab";
import { TabSkeleton } from "./_components/tab-skeleton";

export const metadata = {
  title: "Configuración de Competencias",
};

async function DistancesWrapper() {
  const distances = await getAllMasterDistancesAction();
  return <DistancesTab data={distances} />;
}

async function GendersWrapper() {
  const genders = await getAllMasterGendersAction();
  return <GendersTab data={genders} />;
}

async function AgesWrapper() {
  const ages = await getAllMasterAgeCategoriesAction();
  return <AgesTab data={ages} />;
}

async function EventTypesWrapper() {
  const eventTypes = await getAllMasterEventTypesAction();
  return <EventTypesTab data={eventTypes} />;
}

export default function RaceSettingsPage() {
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
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 p-2 h-auto!">
          <TabsTrigger
            value="distances"
            className="text-xs sm:text-sm whitespace-normal"
          >
            Distancias
          </TabsTrigger>
          <TabsTrigger
            value="genders"
            className="text-xs sm:text-sm whitespace-normal"
          >
            Géneros
          </TabsTrigger>
          <TabsTrigger
            value="ages"
            className="text-xs sm:text-sm whitespace-normal"
          >
            Categorías de Edad
          </TabsTrigger>
          <TabsTrigger
            value="event-types"
            className="text-xs sm:text-sm whitespace-normal"
          >
            Tipos de Evento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="distances">
          <Suspense fallback={<TabSkeleton />}>
            <DistancesWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="genders">
          <Suspense fallback={<TabSkeleton />}>
            <GendersWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="ages">
          <Suspense fallback={<TabSkeleton />}>
            <AgesWrapper />
          </Suspense>
        </TabsContent>

        <TabsContent value="event-types">
          <Suspense fallback={<TabSkeleton />}>
            <EventTypesWrapper />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBanners } from "@/lib/data/banners";
import { Plus } from "lucide-react";
import Link from "next/link";
import { BannersClient } from "../_components/banners-client";

export const metadata = {
  title: "Banners | Admin Inca",
};

export default async function BannersPage() {
  const banners = await getBanners();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Banners Publicitarios
        </h1>
        <Button asChild>
          <Link href="/dashboard/banners/new">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Banner
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Banners</CardTitle>
          <CardDescription>
            Administra las imágenes promocionales que aparecen en el inicio de
            la tienda y la página de eventos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BannersClient data={banners} />
        </CardContent>
      </Card>
    </div>
  );
}

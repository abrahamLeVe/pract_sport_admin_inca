import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBrands } from "@/lib/data/brands";
import { Plus } from "lucide-react";
import Link from "next/link";
import { BrandsClient } from "../_components/brands-client";

export const metadata = {
  title: "Marcas | Admin Inca",
};

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Marcas</h1>
        <Button asChild>
          <Link href="/dashboard/brands/new">
            <Plus className="mr-2 h-4 w-4" /> Nueva Marca
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Marcas</CardTitle>
          <CardDescription>
            Administra los fabricantes y marcas de los productos (Ej: Nike,
            Adidas, Under Armour).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BrandsClient data={brands} />
        </CardContent>
      </Card>
    </div>
  );
}

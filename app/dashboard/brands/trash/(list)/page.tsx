import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrashedBrands } from "@/lib/data/brands";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BrandsClient } from "../../_components/brands-client";

export const metadata = {
  title: "Marcas | Admin Inca",
};

export default async function BrandsTrashPage() {
  const brands = await getTrashedBrands();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Papelera de Marcas</CardTitle>
            <CardDescription>
              Gestiona las marcas eliminados. Restáuralos o elimínalos
              definitivamente.
            </CardDescription>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard/brands">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <BrandsClient data={brands} isTrash={true} />
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrashedProducts } from "@/lib/data/products";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ProductsClient } from "../../_components/products-client";

export const metadata = {
  title: "Productos | Admin Inca",
};

export default async function ProductsTrashPage() {
  const products = await getTrashedProducts();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Papelera de Productos</CardTitle>
            <CardDescription>
              Gestiona los artículos eliminados. Restáuralos o elimínalos
              definitivamente.
            </CardDescription>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard/products">
              {" "}
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <ProductsClient data={products} isTrash={true} />
        </CardContent>
      </Card>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProducts } from "@/lib/data/products";
import { Plus } from "lucide-react";
import Link from "next/link";
import { ProductsClient } from "../_components/products-client";

export const metadata = {
  title: "Productos | Admin Inca",
};

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">
          Catálogo de Productos
        </h1>
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario Principal</CardTitle>
          <CardDescription>
            Administra los artículos de tu tienda, ajusta precios, controla el
            stock general y la visibilidad.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductsClient data={products} />
        </CardContent>
      </Card>
    </div>
  );
}

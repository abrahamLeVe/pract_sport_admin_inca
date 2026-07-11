import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCategories } from "@/lib/data/categories";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { CategoriesClient } from "../_components/categories-client";

export const metadata = {
  title: "Categorías | Admin Inca",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Categorías</h1>
        <div className="flex gap-2">
          <Button variant="destructive" asChild>
            <Link href="/dashboard/categories/trash">
              <Trash2 className="mr-2 h-4 w-4" /> Papelera
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/categories/new">
              <Plus className="mr-2 h-4 w-4" /> Nueva Categoría
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de Familias</CardTitle>
          <CardDescription>
            Agrupa tus productos en familias (Ej: Zapatillas, Nutrición,
            Accesorios).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoriesClient data={categories} />
        </CardContent>
      </Card>
    </div>
  );
}

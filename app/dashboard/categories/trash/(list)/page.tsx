import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrashedCategories } from "@/lib/data/categories";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CategoriesClient } from "../../_components/categories-client";

export const metadata = {
  title: "Categorías | Admin Inca",
};

export default async function CategoriesTrashPage() {
  const categories = await getTrashedCategories();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Papelera de Categorías</CardTitle>
            <CardDescription>
              Gestiona las categorías eliminadas. Restáuralas o elimínalas
              definitivamente.
            </CardDescription>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard/categories">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <CategoriesClient data={categories} isTrash={true} />
        </CardContent>
      </Card>
    </div>
  );
}

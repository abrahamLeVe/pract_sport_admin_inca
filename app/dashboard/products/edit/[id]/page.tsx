import { getBrands } from "@/lib/data/brands";
import { getCategories } from "@/lib/data/categories";
import { getProductByIdAction } from "@/lib/data/products";
// 🔥 Importamos la función para traer los géneros (ajusta la ruta según tu proyecto)
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { VariantsTable } from "../../_components/variants-table";
import { getAllMasterGendersAction } from "@/lib/data/master-data";
import { EditProductForm } from "../../_components/edit-product-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);

  if (isNaN(productId)) {
    redirect("/dashboard/products");
  }

  // 🔥 Agregamos getGenders al array de promesas concurrentes
  const [product, categoriesResponse, brandsResponse, gendersResponse] =
    await Promise.all([
      getProductByIdAction(productId),
      getCategories(),
      getBrands(),
      getAllMasterGendersAction(),
    ]);

  if (!product) {
    redirect("/dashboard/products");
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <EditProductForm
        initialData={product}
        categories={categoriesResponse}
        brands={brandsResponse}
        genders={gendersResponse} // 🔥 Pasamos los géneros como prop
      />

      <Suspense
        fallback={
          <div className="p-8 text-center border rounded animate-pulse bg-muted text-muted-foreground">
            Cargando tabla de variantes...
          </div>
        }
      >
        <VariantsTable
          productId={product.id}
          trackStock={product.track_stock}
        />
      </Suspense>
    </div>
  );
}

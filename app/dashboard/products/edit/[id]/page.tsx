import { getBrands } from "@/lib/data/brands";
import { getCategories } from "@/lib/data/categories";
import { getProductByIdAction } from "@/lib/data/products";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EditProductForm } from "../../_components/edit-product-form";
import { VariantsTable } from "../../_components/variants-table";

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

  const [product, categoriesResponse, brandsResponse] = await Promise.all([
    getProductByIdAction(productId),
    getCategories(),
    getBrands(),
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

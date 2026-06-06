import { getBrandsAction } from "@/lib/data/brands";
import { getCategoriesAction } from "@/lib/data/categories";
import { getProductByIdAction } from "@/lib/data/products";
import { getVariantsByProductIdAction } from "@/lib/data/variant";
import { redirect } from "next/navigation";
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

  const [product, categoriesResponse, brandsResponse, variants] =
    await Promise.all([
      getProductByIdAction(productId),
      getCategoriesAction({ query: "", page: 1, limit: 100 }),
      getBrandsAction({ query: "", page: 1, limit: 100 }),
      getVariantsByProductIdAction(productId),
    ]);

  if (!product) {
    redirect("/dashboard/products");
  }

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 max-w-5xl mx-auto w-full">
      {/* Tu formulario principal intacto */}
      <EditProductForm
        initialData={product}
        categories={categoriesResponse.categories}
        brands={brandsResponse.brands}
      />

      {/* 🔥 3. Inyectamos la tabla de variantes justo debajo */}
      <VariantsTable productId={productId} variants={variants} />
    </div>
  );
}

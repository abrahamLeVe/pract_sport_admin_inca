import { notFound } from "next/navigation";
import { getProductByIdAction } from "@/lib/data/products";
import { getSelectOptionsAction } from "@/lib/data/select-options";
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
    notFound();
  }

  // 1. Obtenemos los datos actuales del producto
  const product = await getProductByIdAction(productId);

  if (!product) {
    notFound();
  }

  // 2. Obtenemos las categorías y marcas para llenar los menús desplegables del formulario
  const { categories, brands } = await getSelectOptionsAction();

  return (
    <div className="p-4 lg:p-8">
      <EditProductForm
        initialData={product}
        categories={categories}
        brands={brands}
      />
    </div>
  );
}

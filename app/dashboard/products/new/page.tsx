import { getSelectOptionsAction } from "@/lib/data/select-options";
import { RegisterProductForm } from "../_components/register-product-form";

export default async function NewProductPage() {
  const { categories, brands } = await getSelectOptionsAction();

  return (
    <div className="p-4 lg:p-8">
      <RegisterProductForm categories={categories} brands={brands} />
    </div>
  );
}

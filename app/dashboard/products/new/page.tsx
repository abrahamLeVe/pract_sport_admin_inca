import { getSelectOptionsAction } from "@/lib/data/select-options";
import { RegisterProductForm } from "../_components/register-product-form";

export default async function NewProductPage() {
  const { categories, brands } = await getSelectOptionsAction();

  return <RegisterProductForm categories={categories} brands={brands} />;
}

import { getSelectOptionsAction } from "@/lib/data/select-options";
import { RegisterProductForm } from "../_components/register-product-form";

export default async function NewProductPage() {
  // 🔥 Recibimos los genders
  const { categories, brands, genders } = await getSelectOptionsAction();

  // 🔥 Pasamos genders al componente
  return (
    <RegisterProductForm
      categories={categories}
      brands={brands}
      genders={genders}
    />
  );
}

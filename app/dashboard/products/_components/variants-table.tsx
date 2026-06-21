import { RegisterVariantDialog } from "./register-variant-dialog";
import { getVariantsByProductIdAction } from "@/lib/data/variant";
import {
  getAllMasterColorsAction,
  getAllMasterSizesAction,
} from "@/lib/data/store-masters";
import { VariantsClient } from "./variants-client"; // 🔥 Importamos el nuevo cliente

interface VariantsTableProps {
  productId: number;
  trackStock: boolean;
}

export async function VariantsTable({
  productId,
  trackStock,
}: VariantsTableProps) {
  const [variants, colors, sizes] = await Promise.all([
    getVariantsByProductIdAction(productId),
    getAllMasterColorsAction(),
    getAllMasterSizesAction(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Tallas y Colores (Variantes)
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona el inventario específico para cada talla y color.
          </p>
        </div>
        <RegisterVariantDialog
          productId={productId}
          colors={colors}
          sizes={sizes}
          parentTrackStock={trackStock}
        />
      </div>

      {/* 🔥 Reemplazamos la tabla cruda por nuestro cliente de DataTable */}
      <div className="rounded-md border bg-card p-4 shadow-sm">
        <VariantsClient
          data={variants}
          colors={colors}
          sizes={sizes}
          productId={productId}
          trackStock={trackStock}
        />
      </div>
    </div>
  );
}

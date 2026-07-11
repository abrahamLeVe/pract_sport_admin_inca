"use client";

import {
  restoreBrandAction,
  permanentlyDeleteBrandAction,
} from "@/app/actions/brands/trash";
import { TrashActionItem } from "@/components/trash-action-item";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function BrandTrashActions({
  brandId,
  brandName,
}: {
  brandId: number;
  brandName: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <TrashActionItem
        id={brandId}
        action={restoreBrandAction}
        title="¿Restaurar marca?"
        description={`¿Deseas restaurar la marca "${brandName}" al catálogo?`}
        buttonText="Restaurar"
        variant="outline"
        confirmVariant="default"
        icon={<RotateCcw className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/brands/trash")}
      />
      <TrashActionItem
        id={brandId}
        action={permanentlyDeleteBrandAction}
        title="¿Eliminar permanentemente?"
        description={`¿ELIMINAR PERMANENTEMENTE "${brandName}"? 
                Esta acción borrará la marca y DESVINCULARÁ todos sus productos asociados. 
                Los productos no se borrarán, pero perderán esta marca.`}
        buttonText="Eliminar permanentemente"
        variant="destructive"
        confirmVariant="destructive"
        icon={<Trash2 className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/brands/trash")}
      />
    </div>
  );
}

"use client";

import {
  restoreCategoryAction,
  permanentlyDeleteCategoryAction,
} from "@/app/actions/categories/trash";
import { TrashActionItem } from "@/components/trash-action-item";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function CategoryTrashActions({
  categoryId,
  categoryName,
}: {
  categoryId: number;
  categoryName: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <TrashActionItem
        id={categoryId}
        action={restoreCategoryAction}
        title="¿Restaurar categoría?"
        description={`¿Deseas restaurar la categoría "${categoryName}" al catálogo?`}
        buttonText="Restaurar"
        variant="outline"
        confirmVariant="default"
        icon={<RotateCcw className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/categories/trash")}
      />
      <TrashActionItem
        id={categoryId}
        action={permanentlyDeleteCategoryAction}
        title="¿Eliminar permanentemente?"
        description={`¿ELIMINAR PERMANENTEMENTE "${categoryName}"? 
                Esta acción borrará la categoría y DESVINCULARÁ todos sus productos asociados. 
                Los productos no se borrarán, pero perderán esta categoría.`}
        buttonText="Eliminar permanentemente"
        variant="destructive"
        confirmVariant="destructive"
        icon={<Trash2 className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/categories/trash")}
      />
    </div>
  );
}

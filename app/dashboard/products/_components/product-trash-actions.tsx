"use client";

import {
  permanentlyDeleteProductAction,
  restoreProductAction,
} from "@/app/actions/products/trash";
import { TrashActionItem } from "@/components/trash-action-item"; // Ajusta la ruta si es necesario
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ProductTrashActions({
  productId,
  productName,
}: {
  productId: number;
  productName: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      {/* Botón Restaurar */}
      <TrashActionItem
        id={productId}
        action={restoreProductAction}
        title="¿Restaurar producto?"
        description={`¿Estás seguro de restaurar "${productName}" al catálogo?`}
        buttonText="Restaurar"
        variant="outline"
        confirmVariant="default" // Botón azul/default para confirmar
        icon={<RotateCcw className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/products/trash")}
      />

      {/* Botón Eliminar Permanentemente */}
      <TrashActionItem
        id={productId}
        action={permanentlyDeleteProductAction}
        title="¿Eliminar permanentemente?"
        description={`¿ELIMINAR PERMANENTEMENTE "${productName}"? Esta acción no se puede deshacer.`}
        buttonText="Eliminar permanentemente"
        variant="destructive"
        confirmVariant="destructive" // Botón rojo para confirmar
        icon={<Trash2 className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/products/trash")}
      />
    </div>
  );
}

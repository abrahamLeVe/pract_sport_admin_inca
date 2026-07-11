"use client";

import {
  permanentlyDeleteBannerAction,
  restoreBannerAction,
} from "@/app/actions/banners/trash";
import { TrashActionItem } from "@/components/trash-action-item"; // Usamos tu componente reutilizable
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function BannerTrashActions({
  bannerId,
  title,
}: {
  bannerId: number;
  title: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <TrashActionItem
        id={bannerId}
        action={restoreBannerAction}
        title="¿Restaurar banner?"
        description={`¿Deseas restaurar el banner "${title}" al catálogo?`}
        buttonText="Restaurar"
        variant="outline"
        confirmVariant="default"
        icon={<RotateCcw className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/banners/trash")}
      />
      <TrashActionItem
        id={bannerId}
        action={permanentlyDeleteBannerAction}
        title="¿Eliminar permanentemente?"
        description={`¿ELIMINAR PERMANENTEMENTE "${title}"? Esta acción borrará el banner y su imagen de S3.`}
        buttonText="Eliminar permanentemente"
        variant="destructive"
        confirmVariant="destructive"
        icon={<Trash2 className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/banners/trash")}
      />
    </div>
  );
}

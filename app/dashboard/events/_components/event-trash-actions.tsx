"use client";

import {
  restoreEventAction,
  permanentlyDeleteEventAction,
} from "@/app/actions/events/trash";
import { TrashActionItem } from "@/components/trash-action-item";
import { RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function EventTrashActions({
  eventId,
  eventTitle,
}: {
  eventId: number;
  eventTitle: string;
}) {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <TrashActionItem
        id={eventId}
        action={restoreEventAction}
        title="¿Restaurar evento?"
        description={`¿Deseas restaurar el evento "${eventTitle}" al catálogo?`}
        buttonText="Restaurar"
        variant="outline"
        confirmVariant="default"
        icon={<RotateCcw className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/events/trash")}
      />
      <TrashActionItem
        id={eventId}
        action={permanentlyDeleteEventAction}
        title="¿Eliminar permanentemente?"
        description={`¿ELIMINAR PERMANENTEMENTE "${eventTitle}"? 
                Esta acción borrará el evento, su galería de imágenes y sus categorías permanentemente.`}
        buttonText="Eliminar permanentemente"
        variant="destructive"
        confirmVariant="destructive"
        icon={<Trash2 className="h-4 w-4" />}
        size="default"
        showText={true}
        onSuccess={() => router.push("/dashboard/events/trash")}
      />
    </div>
  );
}

"use client";
import { updateMediaOrderAction } from "@/app/actions/media/crud";
import { permanentlyDeleteMediaAction } from "@/app/actions/media/trash";
import { MediaWithLinkRow } from "@/validations/media";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function useMediaGallery(
  modelType: string,
  modelId: number,
  initialMedia: MediaWithLinkRow[],
) {
  const [items, setItems] = useState<MediaWithLinkRow[]>(initialMedia);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    setItems(
      [...initialMedia].sort((a, b) => a.display_order - b.display_order),
    );
  }, [initialMedia]);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    setTimeout(() => ((e.target as HTMLElement).style.opacity = "0.5"), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).style.opacity = "1";
    setDraggedId(null);
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    // 🔥 CORRECCIÓN: Buscamos por link_id, no por id
    const oldIndex = items.findIndex((i) => i.link_id === draggedId);
    const newIndex = items.findIndex((i) => i.link_id === targetId);

    // Candado de seguridad por si no los encuentra
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, movedItem);

    const updatedItems = newItems.map((item, index) => ({
      ...item,
      display_order: index + 1,
    }));
    setItems(updatedItems);
    setDraggedId(null);

    const payload = updatedItems.map((i) => ({
      id: i.link_id,
      display_order: i.display_order,
    }));

    const result = await updateMediaOrderAction(payload, modelType, modelId);

    if (!result.success) {
      toast.error(result.message);
      setItems(initialMedia); // Revertir si falla
    }
  };

  const handleDelete = async (linkId: number) => {
    setIsDeleting(linkId);

    // 1. Ejecutamos la eliminación
    const result = await permanentlyDeleteMediaAction(
      linkId,
      modelType,
      modelId,
    );

    if (result.success) {
      // 2. Reordenamos visualmente
      const remainingItems = items.filter((item) => item.link_id !== linkId);
      const updatedItems = remainingItems.map((item, index) => ({
        ...item,
        display_order: index + 1,
      }));

      setItems(updatedItems);

      // 3. Sincronizamos con el servidor
      if (updatedItems.length > 0) {
        const payload = updatedItems.map((i) => ({
          id: i.link_id,
          display_order: i.display_order,
        }));
        await updateMediaOrderAction(payload, modelType, modelId);
      }
    }

    setIsDeleting(null);

    // 🔥 4. RETORNAMOS EL RESULTADO (TrashActionItem se encargará de mostrar el Toast)
    return result;
  };

  return {
    items,
    draggedId,
    isDeleting,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleDelete,
  };
}

// Helper de validación reutilizable
export const validateFile = (file: File, mediaType: string) => {
  const sizeInMB = file.size / (1024 * 1024);
  // Definimos límites lógicos
  const limits = {
    image: 5,
    video: 10,
    document: 10,
    merch: 5,
  };

  const limit = limits[mediaType as keyof typeof limits] || 10;

  if (sizeInMB > limit) {
    return `El archivo supera el límite de ${limit}MB.`;
  }
  return null;
};

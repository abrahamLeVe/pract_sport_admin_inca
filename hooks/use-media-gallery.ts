"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MediaWithLinkRow } from "@/validations/media";
import {
  permanentlyDeleteMediaAction,
  updateMediaOrderAction,
} from "@/app/actions/media/crud";

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

    const oldIndex = items.findIndex((i) => i.id === draggedId);
    const newIndex = items.findIndex((i) => i.id === targetId);
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
      setItems(initialMedia);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este archivo permanentemente?")) return;
    setIsDeleting(id);
    const result = await permanentlyDeleteMediaAction(id, modelType, modelId);
    if (result.success) toast.success(result.message);
    else toast.error(result.message);
    setIsDeleting(null);
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

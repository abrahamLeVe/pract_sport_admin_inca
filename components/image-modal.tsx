"use client";

import { ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  imageUrl: string | null;
  altText: string;
  thumbnailClassName?: string;
}

export function ImageModal({
  imageUrl,
  altText,
  thumbnailClassName,
}: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!imageUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded border bg-muted",
          thumbnailClassName || "h-10 w-10", // Tamaño por defecto (cuadrado)
        )}
      >
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      {/* 1. Miniatura Interactiva */}
      <div
        onClick={() => setIsOpen(true)}
        className={cn(
          "relative cursor-pointer overflow-hidden rounded border bg-muted transition-all hover:scale-110 hover:ring-2 hover:ring-primary/50",
          thumbnailClassName || "h-10 w-10", // Tamaño por defecto
        )}
        title="Ver imagen completa"
      >
        <img
          src={imageUrl}
          alt={altText}
          className="h-full w-full object-cover"
        />
      </div>

      {/* 2. Modal a Pantalla Completa */}
      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 lg:right-8 lg:top-8 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X className="h-8 w-8" />
            </button>

            <img
              src={imageUrl}
              alt={altText}
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}

"use client";

import { ImageIcon, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface BannerImageModalProps {
  imageUrl: string | null;
  altText: string;
}

export function BannerImageModal({ imageUrl, altText }: BannerImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!imageUrl) {
    return (
      <div className="flex h-10 w-16 items-center justify-center rounded border bg-muted">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="relative h-10 w-16 cursor-pointer overflow-hidden rounded border bg-muted transition-all hover:scale-110 hover:ring-2 hover:ring-primary/50"
        title="Ver imagen completa"
      >
        <img
          src={imageUrl}
          alt={altText}
          className="h-full w-full object-cover"
        />
      </div>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)} // Cierra al hacer clic en el fondo negro
          >
            {/* Botón de cerrar */}
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
              onClick={(e) => e.stopPropagation()} // Evita que se cierre si haces clic a la foto
            />
          </div>,
          document.body,
        )}
    </>
  );
}

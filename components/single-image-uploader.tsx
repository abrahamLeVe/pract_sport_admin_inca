"use client";

import { ImagePlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SingleImageUploaderProps {
  id: string; // El id/name del input (ej. "logo", "image", "avatar")
  initialImage?: string | null; // URL de la imagen actual si estás editando
  onFileSelect: (file: File | null) => void; // Función para pasar el archivo al form padre
  disabled?: boolean;
  aspectClass?: string; // Clases de Tailwind para la forma: "aspect-square", "aspect-video", "rounded-full aspect-square"
  placeholderText?: string; // Texto que aparece cuando no hay foto
  maxSizeMB?: number; // Limite de peso en MB (por defecto 5)
}

export function SingleImageUploader({
  id,
  initialImage = null,
  onFileSelect,
  disabled = false,
  aspectClass = "aspect-video rounded-xl",
  placeholderText = "Haz clic aquí para subir una imagen",
  maxSizeMB = 5,
}: SingleImageUploaderProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Formato no válido. Solo JPG, PNG o WEBP.");
        e.target.value = "";
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`La imagen supera el límite de ${maxSizeMB}MB.`);
        e.target.value = "";
        return;
      }

      setImagePreview(URL.createObjectURL(file));
      onFileSelect(file);
    } else {
      setImagePreview(initialImage);
      onFileSelect(null);
    }
  };

  return (
    <>
      <label
        htmlFor={id}
        className={`relative flex cursor-pointer items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-muted/40 overflow-hidden hover:bg-muted/60 transition-colors ${aspectClass}`}
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground p-4 text-center">
            <ImagePlus className="h-8 w-8 mb-2 opacity-50" />
            <span className="text-sm font-medium">{placeholderText}</span>
          </div>
        )}
      </label>

      <input
        id={id}
        type="file"
        className="sr-only"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleImageChange}
        disabled={disabled}
      />
    </>
  );
}

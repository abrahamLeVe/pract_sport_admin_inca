"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface GalleryUploaderProps {
  onFilesChange: (files: File[]) => void;
  htmlFor?: string;
  initialImages?: { url: string; key: string }[];
  onExistingImagesChange?: (images: { url: string; key: string }[]) => void;
}

export function ImageGalleryUploader({
  onFilesChange,
  htmlFor = "gallery-upload",
  initialImages = [],
  onExistingImagesChange,
}: GalleryUploaderProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [existing, setExisting] =
    useState<{ url: string; key: string }[]>(initialImages);

  const initialImagesStr = JSON.stringify(initialImages);

  useEffect(() => {
    setExisting(JSON.parse(initialImagesStr));
  }, [initialImagesStr]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const validFiles = files.filter((file) => {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        toast.error(`Formato no válido: ${file.name}`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Muy pesado: ${file.name}`);
        return false;
      }
      return true;
    });

    const newPreviews = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    const updatedPreviews = [...previews, ...newPreviews];
    setPreviews(updatedPreviews);
    onFilesChange(updatedPreviews.map((p) => p.file));
  };

  const removeNewFile = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  const removeExistingFile = (index: number) => {
    const updated = existing.filter((_, i) => i !== index);
    setExisting(updated);
    if (onExistingImagesChange) {
      onExistingImagesChange(updated);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {existing.map((item, index) => (
        <div
          key={`existing-${index}`}
          className="relative aspect-square rounded-lg overflow-hidden border"
        >
          <img
            src={item.url}
            alt={`existing-${index}`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => removeExistingFile(index)}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-destructive transition-colors"
            title="Quitar imagen guardada"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      {previews.map((item, index) => (
        <div
          key={`new-${index}`}
          className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/50"
        >
          <img
            src={item.url}
            alt={`preview-${index}`}
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={() => removeNewFile(index)}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-destructive transition-colors"
            title="Quitar imagen nueva"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}

      <label
        htmlFor={htmlFor}
        className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 bg-muted/40 rounded-lg cursor-pointer hover:bg-muted/60 transition-colors"
      >
        <ImagePlus className="h-8 w-8 text-muted-foreground opacity-50" />
        <span className="text-xs font-medium text-muted-foreground mt-2 px-2 text-center">
          Subir imágenes
        </span>
        <input
          id={htmlFor}
          type="file"
          multiple
          className="sr-only"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
}

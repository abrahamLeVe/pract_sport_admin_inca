"use client";

import { cn } from "@/lib/utils";
import { Film, UploadCloud, X } from "lucide-react";
import { DragEvent, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export interface UploadItem {
  id: string;
  file?: File;
  url: string;
  key?: string;
  name: string;
  size?: number;
}

interface MediaUploaderProps {
  onItemsChange: (items: UploadItem[]) => void;
  initialItems?: UploadItem[];
  maxFiles?: number;
  label: string;
  id: string;
  description?: string;
  accept?: string;
}

export function MediaUploader({
  onItemsChange,
  initialItems = [],
  maxFiles = 1,
  label,
  id,
  description,
  accept = "image/*",
}: MediaUploaderProps) {
  const [items, setItems] = useState<UploadItem[]>(initialItems);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [isDraggingZone, setIsDraggingZone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onItemsChange(items);
  }, [items, onItemsChange]);

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((file) => {
      if (file.type.startsWith("image/") && file.size > 1 * 1024 * 1024) {
        toast.error(`"${file.name}" supera el límite de 1MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const currentItemsCount = items.length;
    const filesToAdd = validFiles.slice(0, maxFiles - currentItemsCount);

    const newItems: UploadItem[] = filesToAdd.map((file) => ({
      id: Math.random().toString(36).substring(2),
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    const updatedItems = [...items, ...newItems].slice(0, maxFiles);

    const totalBytes = updatedItems.reduce(
      (acc, item) => acc + (item.file?.size || 0),
      0,
    );
    if (totalBytes > 9.5 * 1024 * 1024) {
      toast.error(
        "El peso total de archivos nuevos supera los 10MB permitidos.",
      );
      return;
    }

    setItems(updatedItems);
  };

  const handleDropZone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingZone(false);
    if (e.dataTransfer.files) processFiles(Array.from(e.dataTransfer.files));
  };

  const handleDropReorder = (targetIdx: number) => {
    if (draggedIdx === null) return;
    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIdx, 1);
    newItems.splice(targetIdx, 0, draggedItem);
    setItems(newItems);
    setDraggedIdx(null);
  };

  const renderPreview = (item: UploadItem) => {
    if (
      item.url.includes(".mp4") ||
      item.url.includes(".webm") ||
      item.file?.type.startsWith("video/")
    ) {
      return (
        <div className="w-full h-full bg-black flex items-center justify-center relative pointer-events-none">
          <video
            src={item.url}
            className="w-full h-full object-cover opacity-50"
          />
          <Film className="absolute text-white w-8 h-8" />
        </div>
      );
    }
    return (
      <img
        src={item.url}
        alt="preview"
        className="w-full h-full object-cover pointer-events-none"
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col">
        <div className="text-sm font-medium leading-none">{label}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </div>

      {items.length < maxFiles && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDraggingZone(true);
          }}
          onDragLeave={() => setIsDraggingZone(false)}
          onDrop={handleDropZone}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer text-center flex flex-col items-center justify-center",
            isDraggingZone
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary bg-muted/10",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={maxFiles > 1}
            accept={accept}
            className="hidden"
            id={id}
            onChange={(e) => {
              if (e.target.files) processFiles(Array.from(e.target.files));
              e.target.value = "";
            }}
          />
          <UploadCloud
            className={cn(
              "w-10 h-10 mb-2 transition-colors",
              isDraggingZone ? "text-primary" : "text-muted-foreground",
            )}
          />
          <span className="text-sm font-medium pointer-events-none">
            {isDraggingZone
              ? "Suelta los archivos aquí"
              : "Arrastra o haz clic aquí para subir"}
          </span>
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {items.map((item, i) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDraggedIdx(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleDropReorder(i);
              }}
              className={cn(
                "relative aspect-square border border-border rounded-lg overflow-hidden group bg-muted cursor-move",
                draggedIdx === i && "opacity-50 border-primary border-2",
              )}
            >
              <div className="absolute inset-0 z-0">{renderPreview(item)}</div>

              <div className="absolute top-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md z-20 font-bold backdrop-blur-sm border border-white/10 shadow-sm pointer-events-none">
                #{i + 1}
              </div>

              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-8 z-10 pointer-events-none">
                <p
                  className="text-white text-[11px] truncate font-medium drop-shadow-md"
                  title={item.name}
                >
                  {item.name}
                </p>

                {item.file?.size || item.size ? (
                  <p className="text-white/70 text-[9px] drop-shadow-md">
                    {((item.file?.size || item.size || 0) / 1024).toFixed(0)} KB
                  </p>
                ) : null}
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItems(items.filter((_, idx) => idx !== i));
                  }}
                  className="bg-destructive hover:bg-destructive/90 text-white rounded-full p-1.5 shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

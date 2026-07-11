"use client";

import { addMediaAction } from "@/app/actions/media/crud";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMediaGallery, validateFile } from "@/hooks/use-media-gallery";
import { MediaGalleryProps } from "@/validations/media";
import {
  FileText,
  Grip,
  ImageIcon,
  LinkIcon,
  Loader2,
  Plus,
  UploadCloud,
} from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { TrashActionItem } from "./trash-action-item";

// Helper para videos de YouTube
function getYouTubeEmbedUrl(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
}

export default function MediaManager({
  modelType,
  modelId,
  initialMedia,
}: MediaGalleryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mediaType, setMediaType] = useState<"image" | "video" | "document">(
    "image",
  );
  const [sourceType, setSourceType] = useState<"file" | "url">("file");

  const {
    items,
    draggedId,
    isDeleting,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop,
    handleDelete,
  } = useMediaGallery(modelType, modelId, initialMedia);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };
  const [state, formAction, isPending] = useActionState(addMediaAction, {
    success: false,
    message: "",
  });

  const autoDetectMediaType = (url: string) => {
    if (!url) return;

    // Si es YouTube
    if (
      url.includes("youtube.com") ||
      url.includes("youtu.be") ||
      url.includes("vimeo.com")
    ) {
      setMediaType("video");
    }
    // Si termina en extensión de documento
    else if (
      url.endsWith(".pdf") ||
      url.endsWith(".doc") ||
      url.endsWith(".docx")
    ) {
      setMediaType("document");
    }
    // Si es imagen
    else if (/\.(jpg|jpeg|png|webp|gif)$/i.test(url)) {
      setMediaType("image");
    }
  };

  const handleClientSubmit = (formData: FormData) => {
    if (sourceType === "file") {
      const file = formData.get("media_file") as File | null;
      if (file && file.size > 0) {
        const error = validateFile(file, mediaType);
        if (error) {
          toast.error(error);
          return;
        }
      }
    }
    formAction(formData);
  };

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      setIsOpen(false);
    } else if (state.message) {
      toast.error(state.message);
    }
  }, [state]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Galería Multimedia</h3>
          <p className="text-sm text-muted-foreground">
            Sube documentos o medios y{" "}
            <strong className="text-primary">arrástralos</strong> para ordenar.
          </p>
        </div>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" /> Agregar Medio
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Subir Nuevo Archivo o Enlace</DialogTitle>
              <DialogDescription>
                Añade imágenes, videos o documentos a {modelType}.
              </DialogDescription>
            </DialogHeader>

            <form action={handleClientSubmit} className="space-y-4 mt-4">
              <input type="hidden" name="model_type" value={modelType} />
              <input type="hidden" name="model_id" value={modelId} />
              <input type="hidden" name="source_type" value={sourceType} />
              <input
                type="hidden"
                name="display_order"
                value={items.length + 1}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="media_type_select">Tipo</Label>
                  <Select
                    name="media_type"
                    value={mediaType}
                    onValueChange={(val: any) => setMediaType(val)}
                  >
                    <SelectTrigger id="media_type_select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Imagen</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="document">
                        Documento (PDF/Doc)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="source_type_select">Origen</Label>
                  <Select
                    name="source_type"
                    value={sourceType}
                    onValueChange={(val: any) => setSourceType(val)}
                  >
                    <SelectTrigger id="source_type_select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="file">Subir Archivo</SelectItem>
                      <SelectItem value="url">URL Externa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sourceType === "file" ? (
                <div className="space-y-2">
                  <Label htmlFor="media_file">
                    <UploadCloud className="inline mr-2 h-4 w-4" /> Archivo
                  </Label>
                  <Input
                    id="media_file"
                    name="media_file"
                    type="file"
                    required
                    accept={
                      mediaType === "image"
                        ? "image/*"
                        : mediaType === "video"
                          ? "video/*"
                          : ".pdf,.doc,.docx"
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="media_url">
                    <LinkIcon className="inline mr-2 h-4 w-4" /> URL
                  </Label>
                  <Input
                    id="media_url"
                    name="media_url"
                    type="url"
                    placeholder="https://..."
                    required
                    // 🔥 AQUÍ AGREGAMOS EL AUTO-DETECT
                    onBlur={(e) => autoDetectMediaType(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="alt_text">Texto Alternativo</Label>
                <Input
                  id="alt_text"
                  name="alt_text"
                  placeholder="Ej: Foto de evento"
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Procesando...
                  </>
                ) : (
                  "Guardar Medio"
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center bg-muted/20">
          <ImageIcon className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Sin multimedia</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => {
            const youtubeEmbed =
              item.media_type === "video"
                ? getYouTubeEmbedUrl(item.media_url)
                : null;
            return (
              <Card
                key={item.link_id}
                draggable
                onDragStart={(e) => handleDragStart(e, item.link_id)}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, item.link_id)}
                className="group relative overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute top-2 left-2 z-20 p-1.5 bg-background/80 backdrop-blur rounded-md opacity-0 group-hover:opacity-100 transition-opacity border border-border group-hover:cursor-move">
                  <Grip className="h-4 w-4" />
                </div>
                <CardContent className="p-0">
                  <div className="h-48 w-full flex items-center justify-center relative bg-muted/10">
                    {item.media_type === "image" && (
                      <img
                        src={item.media_url}
                        className="h-full w-full object-cover"
                      />
                    )}
                    {item.media_type === "video" &&
                      (youtubeEmbed ? (
                        <iframe src={youtubeEmbed} className="w-full h-full" />
                      ) : (
                        <video
                          src={item.media_url}
                          controls
                          className="h-full w-full object-cover"
                          preload="metadata"
                        />
                      ))}
                    {item.media_type === "document" && (
                      <FileText className="h-16 w-16 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex-col items-start gap-1 p-3">
                  {/* 1. Lógica para detectar si es externo */}
                  {(() => {
                    const isExternal = !item.media_key || item.media_key === "";
                    // Intentamos sacar el dominio de la URL para que se vea más profesional
                    let hostName = "Enlace Externo";
                    try {
                      hostName = new URL(item.media_url).hostname;
                    } catch (e) {
                      hostName = "Enlace Externo";
                    }

                    return (
                      <div className="w-full">
                        {/* Nombre/Título del archivo o enlace */}
                        <div className="w-full truncate text-sm font-medium text-foreground flex items-center gap-1">
                          {isExternal ? (
                            <a
                              href={item.media_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline text-blue-400 flex items-center gap-1"
                              title={`Abrir ${item.media_url} en nueva pestaña`}
                            >
                              {item.alt_text || hostName}
                              <LinkIcon className="h-3 w-3" />
                            </a>
                          ) : (
                            <span title={item.file_name || "Archivo"}>
                              {item.file_name || "Archivo"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 2. Metadatos (Se ocultan si es externo porque no aplican) */}
                  {!item.media_key && item.media_key !== "" ? (
                    <div className="text-[10px] text-muted-foreground italic">
                      Enlace externo
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground font-mono">
                      {item.width && item.height && (
                        <span>
                          {item.width}x{item.height}px
                        </span>
                      )}
                      {item.size_bytes && item.size_bytes > 0 && (
                        <span>{formatBytes(item.size_bytes)}</span>
                      )}
                      <span className="uppercase">
                        {item.file_format?.split("/").pop()}
                      </span>
                      <span className="uppercase">
                        {item.alt_text || "Sin texto alternativo"}
                      </span>
                    </div>
                  )}

                  <div className="w-full mt-2 flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      #{item.display_order}
                    </span>
                    <TrashActionItem
                      id={item.link_id}
                      action={handleDelete}
                      title="¿Eliminar archivo?"
                      description={`¿Seguro que deseas eliminar ${item.file_name || "este archivo"} permanentemente?`}
                      variant="ghost"
                      size="icon"
                    />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

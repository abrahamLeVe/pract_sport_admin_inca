import { ImageModal } from "@/components/image-modal";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTrashedProductByIdAction } from "@/lib/data/products";
import { getTrashedVariantsByProductId } from "@/lib/data/variant";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProductTrashActions } from "../../_components/product-trash-actions";

import { permanentlyDeleteVariantAction } from "@/app/actions/variants";
import { TrashActionItem } from "@/components/trash-action-item";
import { Suspense } from "react";

export default async function TrashedProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const productId = parseInt(resolvedParams.id, 10);

  const [product, variants] = await Promise.all([
    getTrashedProductByIdAction(productId),
    getTrashedVariantsByProductId(productId),
  ]);

  if (!product) redirect("/dashboard/products/trash");

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Botón Volver */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/products/trash">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>

        {/* 🔥 Tus nuevas acciones aquí */}
        <ProductTrashActions
          productId={product.id}
          productName={product.name}
        />
      </div>

      {/* Banner de Auditoría */}
      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-4 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Producto en papelera</p>
          <p>
            Eliminado por: {product.deleted_by_name || "Sistema"} el{" "}
            {new Date(product.deleted_at_audit).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Layout Principal: Galería + Info Básica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Galería</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5 p-6">
            {/* 🔥 1. SECCIÓN DE PORTADA PRINCIPAL (Siempre arriba y destacada) */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Portada Principal
              </div>

              {product.image_url ? (
                <ImageModal
                  imageUrl={product.image_url}
                  altText={`${product.name} - Portada`}
                  // aspect-[4/3] o aspect-video para que se vea como un banner elegante arriba
                  thumbnailClassName="w-full aspect-square object-cover rounded-lg border shadow-sm transition-all"
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed bg-muted/50">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">Sin imagen de portada</span>
                  </div>
                </div>
              )}
            </div>

            {/* 🔥 2. SECCIÓN DE GALERÍA SECUNDARIA (Abajo en cuadrícula compacta) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Galería de Imágenes
              </div>

              {product.images?.length ? (
                // Subimos a grid-cols-3 o grid-cols-4 para que las imágenes secundarias se vean como miniaturas organizadas debajo
                <div className="grid grid-cols-3 sm:grid-cols-2 gap-2">
                  {product.images.map((img: any, i: number) => (
                    <div key={i}>
                      <ImageModal
                        imageUrl={img.url}
                        altText={`${product.name} - Galería #${i + 1}`}
                        thumbnailClassName="aspect-square w-full object-cover rounded-md border hover:opacity-90 transition-opacity"
                      />
                      <p
                        className="text-white text-[11px] truncate font-medium drop-shadow-md"
                        title={img.file_name}
                      >
                        {img.file_name}
                      </p>
                      {/* Imprime el peso si existe (ya sea de archivo nuevo o de BD) */}
                      {img.file?.size || img.size ? (
                        <p className="text-white/70 text-[9px] drop-shadow-md">
                          {((img.file?.size || img.size || 0) / 1024).toFixed(
                            0,
                          )}{" "}
                          KB
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-center text-muted-foreground bg-muted/30 py-6 rounded-md border border-dashed">
                  Este producto no tiene imágenes adicionales en su galería.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-2xl">{product.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Badge variant="outline">
                {product.category_name || "Sin categoría"}
              </Badge>
              <Badge variant="outline">
                {product.brand_name || "Sin marca"}
              </Badge>
            </div>
            <div>
              {product.description ? (
                <RichTextEditor
                  value={product.description}
                  disabled={true}
                  readOnly
                />
              ) : (
                <p className="text-muted-foreground italic">
                  No presenta descripción.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Técnica (Full Width para que no se apriete) */}
      <Card>
        <CardHeader>
          <CardTitle>Información Técnica Completa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <InfoItem label="ID Interno" value={product.id} />
          <InfoItem label="Slug" value={product.slug} isMono />
          <InfoItem label="Estado" isBadge status={product.status} />
          <InfoItem
            label="Control Stock"
            value={product.track_stock ? "Activado" : "Desactivado"}
          />
          <InfoItem label="Precio Base" value={formatCurrency(product.price)} />
          <InfoItem
            label="Precio Oferta"
            value={
              product.discount_price
                ? formatCurrency(product.discount_price)
                : "No presenta"
            }
          />
          <InfoItem label="Stock Total" value={product.stock} />
          <InfoItem
            label="Fecha Creación"
            value={new Date(product.created_at).toLocaleDateString()}
          />
        </CardContent>
      </Card>

      {/* Variantes (Full Width) */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle Técnico de Variantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.length > 0 ? (
            variants.map((v: any) => (
              <div
                key={v.id}
                className="p-4 border rounded-lg bg-card grid grid-cols-2 md:grid-cols-6 gap-4 text-sm items-center"
              >
                <InfoItem label="Talla" value={v.size_name || "N/A"} />
                <InfoItem label="Color" value={v.color_name || "N/A"} />
                <InfoItem label="SKU" value={v.sku || "N/A"} isMono />
                <InfoItem
                  label="Stock"
                  value={v.track_stock ? `${v.stock} uds` : "Ilimitado"}
                />
                <InfoItem label="Estado" isBadge status={v.status} />
                {/* 🔥 AQUÍ ESTÁ LA MAGIA: Acción específica para la variante */}
                <div className="flex justify-end">
                  <Suspense fallback={<p>Cargando...</p>}>
                    <TrashActionItem
                      id={v.id}
                      action={permanentlyDeleteVariantAction}
                      title="¿Purgar variante?"
                      description="Esta variante se borrará para siempre y no volverá al catálogo."
                      showText
                      buttonText="Purgar" // Lo dejamos vacío para que solo se vea el icono
                      size="default"
                    />
                  </Suspense>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground italic">
              No existen variantes registradas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Reutiliza este componente para mantener la consistencia y el espaciado
function InfoItem({
  label,
  value,
  isMono = false,
  isBadge = false,
  status,
}: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        {label}
      </p>
      {isBadge ? (
        <Badge variant={status === "activo" ? "default" : "secondary"}>
          {status?.toUpperCase() || "SIN ESTADO"}
        </Badge>
      ) : (
        <p className={`font-semibold text-sm ${isMono ? "font-mono" : ""}`}>
          {value}
        </p>
      )}
    </div>
  );
}

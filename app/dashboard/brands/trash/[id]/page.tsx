import { DataTable } from "@/components/data-table";
import { ImageModal } from "@/components/image-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProductsByBrandId,
  getTrashedBrandByIdAction,
} from "@/lib/data/brands";
import { AlertTriangle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BrandTrashActions } from "../../_components/brand-trash-actions";
import { brandProductColumns } from "../../_components/brand-product-columns";

export default async function TrashedBrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const brandId = parseInt(resolvedParams.id, 10);

  // Traemos la marca y los productos asociados concurrentemente
  const [brand, associatedProducts] = await Promise.all([
    getTrashedBrandByIdAction(brandId),
    getProductsByBrandId(brandId),
  ]);
  console.log("product asociado ", associatedProducts);
  if (!brand) redirect("/dashboard/brands/trash");

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/brands/trash">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <BrandTrashActions brandId={brand.id} brandName={brand.name} />
      </div>

      {/* Banner de Auditoría */}
      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-4 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Marca en papelera</p>
          <p>
            Eliminado por: {brand.deleted_by_name || "Sistema"} el{" "}
            {new Date(brand.deleted_at_audit).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Layout Principal: Logo cuadrado + Info Básica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Columna Izquierda: Logo */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Logo</CardTitle>
          </CardHeader>
          <CardContent>
            {brand.image_url ? (
              <ImageModal
                imageUrl={brand.image_url}
                altText={brand.name}
                thumbnailClassName="aspect-square w-full rounded-md"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-md border bg-muted">
                <ImageIcon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Columna Derecha: Detalles */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-2xl">{brand.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Badge
                variant={brand.status === "activo" ? "default" : "secondary"}
              >
                {brand.status?.toUpperCase() || "SIN ESTADO"}
              </Badge>
              <Badge variant="outline">Slug: {brand.slug}</Badge>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">
                Descripción
              </p>
              {brand.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {brand.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No presenta descripción.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Información Técnica */}
      <Card>
        <CardHeader>
          <CardTitle>Información Técnica</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <InfoItem label="ID Interno" value={brand.id} />
          <InfoItem label="Slug" value={brand.slug} isMono />
          <InfoItem
            label="Fecha Creación"
            value={new Date(brand.created_at).toLocaleDateString()}
          />
          <InfoItem
            label="Última Actualización"
            value={new Date(brand.updated_at).toLocaleDateString()}
          />
        </CardContent>
      </Card>
      {/* Tabla de Productos Asociados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            Productos Asociados ({associatedProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {associatedProducts.length > 0 ? (
            <DataTable
              columns={brandProductColumns} // Ahora esto funcionará perfecto
              data={associatedProducts}
              searchKey="name"
            />
          ) : (
            <div className="text-center py-6 text-muted-foreground border rounded-md border-dashed">
              No hay productos asociados a esta marca.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value, isMono = false }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
        {label}
      </p>
      <p
        className={`font-semibold text-sm ${isMono ? "font-mono truncate" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

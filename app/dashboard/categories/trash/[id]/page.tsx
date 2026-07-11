import { DataTable } from "@/components/data-table";
import { ImageModal } from "@/components/image-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getProductsByCategoryId,
  getTrashedCategoryByIdAction,
} from "@/lib/data/categories";
import { AlertTriangle, ArrowLeft, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryTrashActions } from "../../_components/category-trash-actions";
import { CategoryProductColumns } from "../../_components/category-product-columns";

export default async function TrashedCategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const categoryId = parseInt(resolvedParams.id, 10);

  // Traemos la categoría y los productos asociados concurrentemente
  const [category, associatedProducts] = await Promise.all([
    getTrashedCategoryByIdAction(categoryId),
    getProductsByCategoryId(categoryId),
  ]);

  if (!category) redirect("/dashboard/categories/trash");

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/categories/trash">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <CategoryTrashActions
          categoryId={category.id}
          categoryName={category.name}
        />
      </div>

      {/* Banner de Auditoría */}
      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-4 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Categoría en papelera</p>
          <p>
            Eliminado por: {category.deleted_by_name || "Sistema"} el{" "}
            {new Date(category.deleted_at_audit).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Layout Principal: Logo cuadrado + Info Básica */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Columna Izquierda: Logo */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Imagen</CardTitle>
          </CardHeader>
          <CardContent>
            {category.image_url ? (
              <ImageModal
                imageUrl={category.image_url}
                altText={category.name}
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
            <CardTitle className="text-2xl">{category.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-2">
              <Badge
                variant={category.status === "activo" ? "default" : "secondary"}
              >
                {category.status?.toUpperCase() || "SIN ESTADO"}
              </Badge>
              <Badge variant="outline">Slug: {category.slug}</Badge>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-2">
                Descripción
              </p>
              {category.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {category.description}
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
          <InfoItem label="ID Interno" value={category.id} />
          <InfoItem label="Slug" value={category.slug} isMono />
          <InfoItem
            label="Fecha Creación"
            value={new Date(category.created_at).toLocaleDateString()}
          />
          <InfoItem
            label="Última Actualización"
            value={new Date(category.updated_at).toLocaleDateString()}
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
              columns={CategoryProductColumns}
              data={associatedProducts}
              searchKey="name"
            />
          ) : (
            <div className="text-center py-6 text-muted-foreground border rounded-md border-dashed">
              No hay productos asociados a esta categoría.
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

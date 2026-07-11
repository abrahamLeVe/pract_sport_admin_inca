import { AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTrashedBannerByIdAction } from "@/lib/data/banners";
import { BannerTrashActions } from "../../_components/banner-trash-actions";

export default async function TrashedBannerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const banner = await getTrashedBannerByIdAction(
    parseInt(resolvedParams.id, 10),
  );

  if (!banner) redirect("/dashboard/banners/trash");

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/banners/trash">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <BannerTrashActions bannerId={banner.id} title={banner.title} />
      </div>

      {/* Banner de Auditoría */}
      <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg flex items-center gap-4 text-destructive">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="text-sm">
          <p className="font-bold">Banner en papelera</p>
          <p>
            Eliminado por: {banner.deleted_by_name || "Sistema"} el{" "}
            {new Date(banner.deleted_at_audit).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Imagen Principal 16/9 */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden border bg-muted">
        <img
          src={banner.image_url}
          alt={banner.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Detalles Técnicos */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Banner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <InfoItem label="Título" value={banner.title} />
          <InfoItem label="Tipo" value={banner.type} />
          <InfoItem label="Estado" isBadge status={banner.status} />
          <InfoItem label="Orden" value={banner.sort_order} />

          <div className="col-span-2 md:col-span-4">
            <InfoItem
              label="Subtítulo"
              value={banner.subtitle || "Sin subtítulo"}
            />
          </div>

          <InfoItem label="Link URL" value={banner.link_url || "N/A"} isMono />
          <InfoItem
            label="Evento Asociado"
            value={banner.event_name || "Ninguno"}
          />
          <InfoItem
            label="Inicio"
            value={
              banner.start_date
                ? new Date(banner.start_date).toLocaleDateString()
                : "No definido"
            }
          />
          <InfoItem
            label="Fin"
            value={
              banner.end_date
                ? new Date(banner.end_date).toLocaleDateString()
                : "No definido"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Reutilizamos el componente InfoItem que ya tienes
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
        <p
          className={`font-semibold text-sm ${isMono ? "font-mono truncate" : ""}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

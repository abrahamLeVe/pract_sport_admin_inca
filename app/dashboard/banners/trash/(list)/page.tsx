import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getTrashedBanners } from "@/lib/data/banners";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BannersClient } from "../../_components/banners-client";

export const metadata = {
  title: "Banners | Admin Inca",
};

export default async function BannersTrashPage() {
  const banners = await getTrashedBanners();

  return (
    <div className="space-y-4 p-2 md:p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Papelera de Banners</CardTitle>
            <CardDescription>
              Gestiona los artículos eliminados. Restáuralos o elimínalos
              definitivamente.
            </CardDescription>
          </div>

          <Button variant="outline" asChild>
            <Link href="/dashboard/banners">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver al catálogo
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <BannersClient data={banners} isTrash={true} />
        </CardContent>
      </Card>
    </div>
  );
}

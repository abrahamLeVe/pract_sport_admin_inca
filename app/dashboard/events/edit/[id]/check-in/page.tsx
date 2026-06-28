"use client";

import { Hash, Search, Shirt, UserCheck, X } from "lucide-react";
import { use, useState, useTransition } from "react";
import { toast } from "sonner";
import { useDebouncedCallback } from "use-debounce";

import {
  markKitDeliveredAction,
  searchForCheckInAction,
  type CheckInAthlete,
} from "@/app/actions/check-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function CheckInPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 🔥 2. Desenvolvemos la promesa usando use()
  const resolvedParams = use(params);
  const eventId = Number(resolvedParams.id);
  const [query, setQuery] = useState("");
  const [athletes, setAthletes] = useState<CheckInAthlete[]>([]);
  const [isSearching, startSearch] = useTransition();

  const handleSearch = useDebouncedCallback((term: string) => {
    if (term.length < 2) {
      setAthletes([]);
      return;
    }
    startSearch(async () => {
      const results = await searchForCheckInAction(eventId, term);
      setAthletes(results);
    });
  }, 300);

  const toggleKitStatus = async (athleteId: number, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Actualización Optimista (cambia la UI al instante sin esperar a la BD)
    setAthletes((prev) =>
      prev.map((a) =>
        a.id === athleteId ? { ...a, kit_delivered: newStatus } : a,
      ),
    );

    const res = await markKitDeliveredAction(athleteId, newStatus);
    if (res.success) {
      toast.success(newStatus ? "¡Kit Entregado!" : "Entrega revertida");
    } else {
      // Si falla, revertimos la UI
      setAthletes((prev) =>
        prev.map((a) =>
          a.id === athleteId ? { ...a, kit_delivered: currentStatus } : a,
        ),
      );
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">
          Modo Check-In Rápido
        </h1>
        <p className="text-muted-foreground text-lg">
          Escanea o digita el DNI del corredor
        </p>
      </div>

      <div className="relative mb-8 ">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <Input
          id="checkin-id"
          autoFocus
          className="h-16 pl-14 text-2xl rounded-2xl"
          placeholder="Ej: 71234567 o Mendoza..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          type="search"
        />
        {isSearching && (
          <span className="absolute right-10 top-1/2 -translate-y-1/2 text-sm text-muted-foreground animate-pulse">
            Buscando...
          </span>
        )}
      </div>

      <div className="space-y-4">
        {athletes.map((athlete) => (
          <Card
            key={athlete.id}
            className={`overflow-hidden border-2 transition-colors ${athlete.kit_delivered ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : ""}`}
          >
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 space-y-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <h2 className="text-2xl font-bold uppercase">
                    {athlete.last_name}, {athlete.first_name}
                  </h2>
                  {athlete.status === "paid" ? (
                    <Badge variant="default" className="bg-green-600">
                      Pagado
                    </Badge>
                  ) : (
                    <Badge variant="destructive">Sin Pago</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-lg">
                  DNI: {athlete.document}
                </p>
              </div>

              <div className="flex items-center gap-6 bg-muted/50 p-4 rounded-xl">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1">
                    <Hash className="h-3 w-3" /> DORSAL
                  </p>
                  <p className="text-3xl font-black">
                    {athlete.bib_number || "---"}
                  </p>
                </div>
                <div className="w-px h-12 bg-border"></div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-semibold flex items-center justify-center gap-1">
                    <Shirt className="h-3 w-3" /> POLO
                  </p>
                  <p className="text-3xl font-black">{athlete.tshirt_size}</p>
                </div>
              </div>

              <Button
                size="lg"
                disabled={athlete.status !== "paid"}
                onClick={() =>
                  toggleKitStatus(athlete.id, athlete.kit_delivered)
                }
                className={`h-20 w-full md:w-48 text-lg font-bold transition-all ${
                  athlete.kit_delivered
                    ? "bg-red-100 text-red-700 hover:bg-red-200 border-2 border-red-200"
                    : "bg-green-600 hover:bg-green-700 text-white shadow-lg"
                }`}
              >
                {athlete.kit_delivered ? (
                  <>
                    <X className="mr-2 h-6 w-6" /> Deshacer
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-6 w-6" /> Entregar Kit
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}

        {query.length > 2 && athletes.length === 0 && !isSearching && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-xl">
              No se encontró a ningún corredor con ese dato.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

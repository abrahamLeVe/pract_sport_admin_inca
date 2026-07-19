"use client";

import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, User, RefreshCcw } from "lucide-react";
import { processCheckInAction } from "@/app/actions/check-in";

export function QrScannerClient({ eventId }: { eventId: number }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAthlete, setLastAthlete] = useState<any>(null);

  // 🔥 Usamos useRef para el "candado" interno.
  // Esto muta en el fondo y JAMÁS congela el flujo de video de la cámara.
  const isScanningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleScan = async (text: string) => {
    // Si ya está procesando una lectura, o si el lector disparó el mismo código
    // dos veces en menos de un segundo (rebote), lo ignoramos.
    if (isScanningRef.current || lastScannedRef.current === text) return;

    // 1. Cerramos el candado inmediatamente
    isScanningRef.current = true;
    lastScannedRef.current = text;

    // 2. Avisamos a la UI para mostrar el texto animado
    setIsProcessing(true);

    try {
      const result = await processCheckInAction(eventId, text);

      if (result.success) {
        if (result.requiresAttention) {
          toast.warning("¡Atención!", { description: result.errorMessage });
        } else {
          toast.success("¡Check-in exitoso!", {
            description: `Atleta: ${result.athleteName} - Talla: ${result.tshirtSize}`,
          });
        }
        setLastAthlete(result);
      } else {
        toast.error("Error en el Check-in", {
          description: result.error,
        });
      }
    } catch (error) {
      toast.error("Ocurrió un error al procesar el código.");
    } finally {
      // 3. Abrimos el candado después de 2.5 segundos.
      // Esto da tiempo al staff de apartar el código QR actual y poner el siguiente.
      setTimeout(() => {
        isScanningRef.current = false;
        lastScannedRef.current = null;
        setIsProcessing(false);
      }, 2500);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Columna Izquierda: La Cámara */}
      <Card>
        <CardHeader>
          <CardTitle>Escáner de Kits / Check-in</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border-4 border-muted relative">
            <Scanner
              onScan={(results) => {
                if (results && results.length > 0) {
                  handleScan(results[0].rawValue);
                }
              }}
              onError={(error: any) => console.log(error?.message)}
              formats={["qr_code"]}
            />

            {/* Capa superpuesta semitransparente cuando está procesando */}
            {isProcessing && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full font-bold animate-pulse shadow-lg">
                  Procesando QR...
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Columna Derecha: Información del Atleta Escaneado */}
      <Card>
        <CardHeader>
          <CardTitle>Último Atleta Procesado</CardTitle>
        </CardHeader>
        <CardContent>
          {lastAthlete ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-900">
                <CheckCircle2 className="h-8 w-8" />
                <div>
                  <p className="font-bold text-lg">Kit Entregado</p>
                  <p className="text-sm opacity-90">
                    Dorsal asignado:{" "}
                    <span className="font-mono font-bold">
                      #{lastAthlete.bibNumber || "Pendiente"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-lg">
                    {lastAthlete.athleteName}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                      Categoría
                    </span>
                    <span className="font-medium">
                      {lastAthlete.categoryName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                      Talla de Polo
                    </span>
                    <span className="font-black text-xl">
                      {lastAthlete.tshirtSize}
                    </span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setLastAthlete(null);
                  // Por si el usuario quiere limpiar manualmente forzamos abrir el candado
                  isScanningRef.current = false;
                  lastScannedRef.current = null;
                }}
                className="mt-4"
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Limpiar Pantalla
              </Button>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center min-h-[250px] text-muted-foreground text-sm text-center border-2 border-dashed rounded-lg p-6">
              <div className="bg-muted p-4 rounded-full mb-4">
                <User className="h-8 w-8 opacity-50" />
              </div>
              <p className="font-medium text-base mb-1">La cámara está lista</p>
              <p>Apunta al código QR del corredor para ver sus datos aquí.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

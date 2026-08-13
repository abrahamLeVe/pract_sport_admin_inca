"use client";

import { useState, useRef } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { processRaceDayAttendance } from "@/app/actions/attendance";

export default function RaceDayScannerPage() {
  const [isScanning, setIsScanning] = useState(true);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | null;
    text: string;
  }>({ type: null, text: "" });

  // Candado de seguridad para evitar dobles lecturas instantáneas
  const isScanningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  const handleDecode = async (text: string) => {
    if (isScanningRef.current || lastScannedRef.current === text) return;

    // 1. Cerramos el candado y pausamos la interfaz
    isScanningRef.current = true;
    lastScannedRef.current = text;
    setIsScanning(false);
    setFeedback({ type: null, text: "Verificando en base de datos..." });

    // 2. Llamamos a nuestra NUEVA función de asistencia en PostgreSQL
    const response = await processRaceDayAttendance(text);

    // 3. Mostramos el resultado en pantalla
    if (response.success) {
      setFeedback({ type: "success", text: response.message || "" });
    } else {
      setFeedback({ type: "error", text: response.error || "" });
    }

    // 4. Esperamos 3 segundos para que puedas leer la pantalla, y reactivamos la cámara
    setTimeout(() => {
      setFeedback({ type: null, text: "" });
      setIsScanning(true);
      isScanningRef.current = false;
      lastScannedRef.current = null;
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Escáner de Partida 🏃‍♂️
      </h1>

      <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-lg border-4 border-slate-800 bg-black">
        {isScanning ? (
          <Scanner
            onScan={(results) => {
              if (results && results.length > 0) {
                handleDecode(results[0].rawValue);
              }
            }}
            onError={(error: any) => console.log(error?.message)}
            formats={["qr_code"]}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6 text-center z-10 bg-slate-950">
            {feedback.type === "success" && (
              <div className="text-green-500 animate-in zoom-in">
                <p className="text-6xl mb-4">✅</p>
                <p className="text-xl font-bold text-green-400">
                  {feedback.text}
                </p>
              </div>
            )}
            {feedback.type === "error" && (
              <div className="text-red-500 animate-in zoom-in">
                <p className="text-6xl mb-4">❌</p>
                <p className="text-xl font-bold text-red-400">
                  {feedback.text}
                </p>
              </div>
            )}
            {feedback.type === null && (
              <div className="text-blue-500 animate-pulse">
                <p className="text-xl font-bold text-blue-400">
                  {feedback.text}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-8 text-muted-foreground text-center">
        {isScanning
          ? "Apunta la cámara al código QR del atleta."
          : "Procesando código..."}
      </p>
    </div>
  );
}

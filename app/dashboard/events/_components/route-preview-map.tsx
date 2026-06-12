"use client";

import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useMemo } from "react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

interface RoutePreviewMapProps {
  geoJsonString: string;
}

export function RoutePreviewMap({ geoJsonString }: RoutePreviewMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Intentamos parsear el JSON en tiempo real sin romper la app si el admin está tecleando
  const path = useMemo(() => {
    try {
      if (!geoJsonString.trim()) return [];
      const parsed = JSON.parse(geoJsonString);
      if (parsed?.geometry?.coordinates) {
        return parsed.geometry.coordinates.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0],
        }));
      }
      return [];
    } catch (e) {
      return []; // Si el JSON está incompleto, retornamos arreglo vacío
    }
  }, [geoJsonString]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Cargando mapa...
      </div>
    );
  }

  if (path.length === 0) {
    return (
      <div className="w-full h-full bg-muted/40 flex items-center justify-center text-xs text-muted-foreground border-dashed border-2">
        Pegue un GeoJSON válido para ver la ruta
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={path[0]}
      zoom={15}
      // 🔥 1. ESTA ES LA MAGIA: "hybrid" muestra satélite + nombres de calles
      mapTypeId="hybrid"
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        // 🔥 2. Encendemos el botón para que el admin pueda cambiar entre "Mapa" y "Satélite"
        mapTypeControl: true,
      }}
    >
      <Polyline
        path={path}
        options={{
          strokeColor: "#EF4444",
          strokeOpacity: 0.8,
          strokeWeight: 4,
        }}
      />
    </GoogleMap>
  );
}

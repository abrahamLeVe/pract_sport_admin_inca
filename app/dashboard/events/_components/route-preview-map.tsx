"use client";

import { GoogleMap, Polyline, useJsApiLoader } from "@react-google-maps/api";
import { useMemo, useState, useEffect } from "react";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// 🔥 1. Extraemos el array de librerías fuera del componente para evitar re-renders infinitos
const libraries: "marker"[] = ["marker"];

interface RoutePreviewMapProps {
  geoJsonString: string;
}

export function RoutePreviewMap({ geoJsonString }: RoutePreviewMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries, // 🔥 2. Le decimos al loader que traiga la librería "marker"
  });

  // 🔥 3. Estado para guardar la instancia del mapa una vez cargue
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Mantenemos exactamente la misma lógica de lectura del GeoJSON
  const { path, markers } = useMemo(() => {
    try {
      if (!geoJsonString.trim()) return { path: [], markers: [] };
      const parsed = JSON.parse(geoJsonString);

      let newPath: { lat: number; lng: number }[] = [];
      let newMarkers: { lat: number; lng: number; name?: string }[] = [];

      if (parsed.type === "FeatureCollection" && parsed.features) {
        parsed.features.forEach((feature: any) => {
          if (feature.geometry?.type === "LineString") {
            newPath = feature.geometry.coordinates.map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }));
          } else if (feature.geometry?.type === "Point") {
            newMarkers.push({
              lat: feature.geometry.coordinates[1],
              lng: feature.geometry.coordinates[0],
              name: feature.properties?.name || "",
            });
          }
        });
      } else if (parsed?.geometry?.type === "LineString") {
        newPath = parsed.geometry.coordinates.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0],
        }));
      }

      return { path: newPath, markers: newMarkers };
    } catch (e) {
      return { path: [], markers: [] };
    }
  }, [geoJsonString]);

  // 🔥 4. Creamos los marcadores avanzados de forma nativa usando useEffect
  useEffect(() => {
    if (!map || markers.length === 0 || !window.google) return;

    // Arreglo para poder borrarlos si el JSON cambia
    const advancedMarkers: google.maps.marker.AdvancedMarkerElement[] = [];

    markers.forEach((markerData, index) => {
      // Configuramos el diseño del "pin" (El marcador rojo con la letra blanca)
      // 🔥 Le decimos a TypeScript que confíe en nuestra estructura
      const pinOptions = {
        glyphText: String.fromCharCode(65 + index),
        glyphColor: "white",
        background: "#EA4335",
        borderColor: "#C5221F",
      } as google.maps.marker.PinElementOptions & { glyphText: string };

      const pinBackground = new google.maps.marker.PinElement(pinOptions);

      // Insertamos el Marcador Avanzado en el mapa
      const newMarker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        position: { lat: markerData.lat, lng: markerData.lng },
        content: pinBackground,
      });

      advancedMarkers.push(newMarker);
    });

    // Función de limpieza: quita los pines del mapa si se actualiza el GeoJSON
    return () => {
      advancedMarkers.forEach((m) => {
        m.map = null;
      });
    };
  }, [map, markers]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center text-xs text-muted-foreground">
        Cargando mapa...
      </div>
    );
  }

  if (path.length === 0 && markers.length === 0) {
    return (
      <div className="w-full h-full bg-muted/40 flex items-center justify-center text-xs text-muted-foreground border-dashed border-2">
        Pegue un GeoJSON válido para ver la ruta
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={path[0] || markers[0]}
      zoom={15}
      mapTypeId="hybrid"
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        // 🔥 5. Insertamos el Map ID requerido para AdvancedMarkers (usa un fallback temporal por si acaso)
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || "DEMO_MAP_ID",
      }}
      // 🔥 6. Capturamos la instancia del mapa para podérsela pasar a los AdvancedMarkers
      onLoad={(mapInstance) => setMap(mapInstance)}
    >
      {path.length > 0 && (
        <Polyline
          path={path}
          options={{
            strokeColor: "#EF4444",
            strokeOpacity: 0.8,
            strokeWeight: 4,
          }}
        />
      )}
    </GoogleMap>
  );
}

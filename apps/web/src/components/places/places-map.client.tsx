"use client";

import "leaflet/dist/leaflet.css";

import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import { cn } from "@/lib/utils";
import type { PlaceSummary } from "@/types";

function MapBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap();

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, bounds]);

  return null;
}

function computeBounds(places: PlaceSummary[]): LatLngBoundsExpression | null {
  if (places.length === 0) {
    return null;
  }

  let south = places[0].coordinates.lat;
  let north = places[0].coordinates.lat;
  let west = places[0].coordinates.lng;
  let east = places[0].coordinates.lng;

  for (const place of places) {
    const { lat, lng } = place.coordinates;
    south = Math.min(south, lat);
    north = Math.max(north, lat);
    west = Math.min(west, lng);
    east = Math.max(east, lng);
  }

  return [
    [south, west],
    [north, east],
  ];
}

function computeCenter(places: PlaceSummary[]): LatLngTuple {
  if (places.length === 0) {
    return [37.0, 27.0];
  }

  const sum = places.reduce(
    (acc, place) => {
      acc.lat += place.coordinates.lat;
      acc.lng += place.coordinates.lng;
      return acc;
    },
    { lat: 0, lng: 0 },
  );

  return [sum.lat / places.length, sum.lng / places.length];
}

type PlacesMapClientProps = {
  places: PlaceSummary[];
  className?: string;
};

export function PlacesMapClient({ places, className }: PlacesMapClientProps) {
  const bounds = useMemo(() => computeBounds(places), [places]);
  const center = useMemo(() => computeCenter(places), [places]);

  return (
    <div className={cn("h-full w-full", className)}>
      <MapContainer
        className="h-full w-full"
        center={center}
        zoom={9}
        scrollWheelZoom
        attributionControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
        />
        <MapBounds bounds={bounds} />
        {places.map((place) => (
          <CircleMarker
            key={place.id}
            center={[place.coordinates.lat, place.coordinates.lng]}
            pathOptions={{ color: "#ff5a5f", fillColor: "#ff5a5f", fillOpacity: 0.8 }}
            radius={10}
          >
            <Popup>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">{place.name}</h3>
                <p className="text-xs text-muted-foreground">{place.city}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

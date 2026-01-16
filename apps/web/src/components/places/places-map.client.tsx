"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import { Check, Minus, Plus, Square } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PlaceSummary } from "@/types";

import { createMarkerHtml } from "./map-price-marker";

// Custom hook for map bounds and events
function MapController({
  bounds,
  searchAsMove,
  onBoundsChange,
}: {
  bounds: LatLngBoundsExpression | null;
  searchAsMove: boolean;
  onBoundsChange?: (bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => void;
}) {
  const map = useMap();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [map, bounds]);

  // Handle map move end to emit bounds
  useMapEvents({
    moveend: () => {
      if (!searchAsMove || !onBoundsChange) return;

      // Debounce the bounds change
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const mapBounds = map.getBounds();
        onBoundsChange({
          minLat: mapBounds.getSouth(),
          minLng: mapBounds.getWest(),
          maxLat: mapBounds.getNorth(),
          maxLng: mapBounds.getEast(),
        });
      }, 500);
    },
  });

  return null;
}

// Zoom controls component
function ZoomControls() {
  const map = useMap();

  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-1 rounded-lg bg-white shadow-md">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-t-lg rounded-b-none border-b border-gray-100"
        onClick={() => map.zoomIn()}
      >
        <Plus className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-b-lg rounded-t-none"
        onClick={() => map.zoomOut()}
      >
        <Minus className="size-4" />
      </Button>
    </div>
  );
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

// Create custom icon for price markers
function createPriceIcon(price: number, isActive: boolean) {
  return L.divIcon({
    className: "!bg-transparent !border-none",
    html: createMarkerHtml(price, isActive),
    iconSize: [80, 30],
    iconAnchor: [40, 15],
  });
}

type PlacesMapClientProps = {
  places: PlaceSummary[];
  className?: string;
  hoveredPlaceId?: string | null;
  onPlaceClick?: (placeId: string) => void;
  onPlaceHover?: (placeId: string | null) => void;
  searchAsMove?: boolean;
  onSearchAsMoveChange?: (enabled: boolean) => void;
  onBoundsChange?: (bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => void;
};

export function PlacesMapClient({
  places,
  className,
  hoveredPlaceId,
  onPlaceClick,
  onPlaceHover,
  searchAsMove = false,
  onSearchAsMoveChange,
  onBoundsChange,
}: PlacesMapClientProps) {
  const bounds = useMemo(() => computeBounds(places), [places]);
  const center = useMemo(() => computeCenter(places), [places]);
  const [localSearchAsMove, setLocalSearchAsMove] = useState(searchAsMove);

  const handleSearchAsMoveToggle = useCallback(() => {
    const newValue = !localSearchAsMove;
    setLocalSearchAsMove(newValue);
    onSearchAsMoveChange?.(newValue);
  }, [localSearchAsMove, onSearchAsMoveChange]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapContainer
        className="h-full w-full"
        center={center}
        zoom={9}
        scrollWheelZoom
        attributionControl={false}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        <MapController
          bounds={bounds}
          searchAsMove={localSearchAsMove}
          onBoundsChange={onBoundsChange}
        />
        <ZoomControls />

        {places.map((place) => {
          const isActive = hoveredPlaceId === place.id;
          return (
            <Marker
              key={place.id}
              position={[place.coordinates.lat, place.coordinates.lng]}
              icon={createPriceIcon(place.nightlyPrice, isActive)}
              eventHandlers={{
                click: () => onPlaceClick?.(place.id),
                mouseover: () => onPlaceHover?.(place.id),
                mouseout: () => onPlaceHover?.(null),
              }}
            >
              <Popup>
                <div className="min-w-[200px] space-y-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {place.name}
                  </h3>
                  <p className="text-sm text-gray-500">{place.city}</p>
                  <p className="text-sm font-medium text-gray-700">
                    ₺{place.nightlyPrice.toLocaleString("tr-TR")}/gece
                  </p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Search as I move toggle */}
      <div className="absolute bottom-6 left-1/2 z-[1000] -translate-x-1/2">
        <button
          onClick={handleSearchAsMoveToggle}
          className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-md transition-all hover:shadow-lg"
        >
          <div
            className={cn(
              "flex size-5 items-center justify-center rounded border transition-colors",
              localSearchAsMove
                ? "border-gray-900 bg-gray-900"
                : "border-gray-300 bg-white",
            )}
          >
            {localSearchAsMove && <Check className="size-3 text-white" />}
          </div>
          <span className="text-sm font-medium text-gray-700">
            Haritayı hareket ettirirken ara
          </span>
        </button>
      </div>
    </div>
  );
}

"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import type { LatLngBoundsExpression, LatLngTuple } from "leaflet";
import { Check, Minus, Plus } from "lucide-react";
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
import { MapPlacePreviewCard } from "./map-place-preview-card";

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

// Helper to validate coordinates
function isValidCoordinate(coord: { lat: number; lng: number }): boolean {
  return (
    typeof coord.lat === "number" &&
    typeof coord.lng === "number" &&
    !Number.isNaN(coord.lat) &&
    !Number.isNaN(coord.lng) &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lng >= -180 &&
    coord.lng <= 180
  );
}

function computeBounds(places: PlaceSummary[]): LatLngBoundsExpression | null {
  const validPlaces = places.filter((p) => isValidCoordinate(p.coordinates));

  if (validPlaces.length === 0) {
    return null;
  }

  let south = validPlaces[0].coordinates.lat;
  let north = validPlaces[0].coordinates.lat;
  let west = validPlaces[0].coordinates.lng;
  let east = validPlaces[0].coordinates.lng;

  for (const place of validPlaces) {
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
  const validPlaces = places.filter((p) => isValidCoordinate(p.coordinates));

  if (validPlaces.length === 0) {
    // Default to Muğla center
    return [37.0, 28.3];
  }

  const sum = validPlaces.reduce(
    (acc, place) => {
      acc.lat += place.coordinates.lat;
      acc.lng += place.coordinates.lng;
      return acc;
    },
    { lat: 0, lng: 0 },
  );

  return [sum.lat / validPlaces.length, sum.lng / validPlaces.length];
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
  markerMode?: "price" | "pin";
  showSearchAsMoveToggle?: boolean;
  initialZoom?: number;
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
  markerMode = "price",
  showSearchAsMoveToggle = true,
  initialZoom = 9,
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

  const createPinIcon = useCallback((isActive: boolean) => {
    return L.divIcon({
      className: "!bg-transparent !border-none",
      html: `<div class="${
        isActive
          ? "h-4 w-4 rounded-full border-2 border-white bg-gray-900 shadow-lg"
          : "h-4 w-4 rounded-full border-2 border-white bg-primary shadow-md"
      }"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }, []);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapContainer
        className="h-full w-full bg-slate-100"
        center={center}
        zoom={initialZoom}
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

        {places
          .filter((place) => isValidCoordinate(place.coordinates))
          .map((place) => {
            const isActive = hoveredPlaceId === place.id;
            return (
              <Marker
                key={place.id}
                position={[place.coordinates.lat, place.coordinates.lng]}
                icon={
                  markerMode === "pin"
                    ? createPinIcon(isActive)
                    : createPriceIcon(place.nightlyPrice, isActive)
                }
                eventHandlers={{
                  mouseover: () => onPlaceHover?.(place.id),
                  mouseout: () => onPlaceHover?.(null),
                }}
              >
                <Popup
                  closeButton={false}
                  offset={[0, -12]}
                  className="places-map-preview-popup"
                  maxWidth={340}
                  minWidth={300}
                  autoPanPadding={[20, 20]}
                >
                  <MapPlacePreviewCard
                    place={place}
                    onViewPlace={onPlaceClick}
                  />
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Search as I move toggle */}
      {showSearchAsMoveToggle ? (
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
      ) : null}
    </div>
  );
}

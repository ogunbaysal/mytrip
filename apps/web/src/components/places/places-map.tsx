"use client";

import dynamic from "next/dynamic";

import type { PlaceSummary } from "@/types";

const DynamicPlacesMap = dynamic(
  () => import("./places-map.client").then((mod) => mod.PlacesMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
        Harita yükleniyor...
      </div>
    ),
  },
);

type PlacesMapProps = {
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

export function PlacesMap(props: PlacesMapProps) {
  return <DynamicPlacesMap {...props} />;
}

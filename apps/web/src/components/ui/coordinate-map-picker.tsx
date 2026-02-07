"use client";

import dynamic from "next/dynamic";

const CoordinateMapPickerLeaflet = dynamic(
  () =>
    import("@/components/ui/coordinate-map-picker-leaflet").then(
      (mod) => mod.CoordinateMapPickerLeaflet,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 w-full items-center justify-center rounded-lg border text-sm text-muted-foreground">
        Harita yükleniyor...
      </div>
    ),
  },
);

type CoordinateMapPickerProps = {
  latitude: number;
  longitude: number;
  onChange: (coords: { lat: number; lng: number }) => void;
  zoom?: number;
};

export function CoordinateMapPicker(props: CoordinateMapPickerProps) {
  return <CoordinateMapPickerLeaflet {...props} />;
}

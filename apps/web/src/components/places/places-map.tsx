import dynamic from "next/dynamic";

import type { PlaceSummary } from "@/types";

const DynamicPlacesMap = dynamic(() => import("./places-map.client").then((mod) => mod.PlacesMapClient), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">Harita yükleniyor...</div>,
});

type PlacesMapProps = {
  places: PlaceSummary[];
  className?: string;
};

export function PlacesMap(props: PlacesMapProps) {
  return <DynamicPlacesMap {...props} />;
}

import { Check } from "lucide-react";

import type { PlaceAmenity } from "@/types";

type PlaceDetailAmenitiesSectionProps = {
  amenities: PlaceAmenity[];
};

function renderAmenityIcon(icon: string) {
  if (!icon || icon === "•") {
    return <Check className="h-4 w-4" aria-hidden />;
  }

  return <span className="text-sm leading-none">{icon}</span>;
}

export function PlaceDetailAmenitiesSection({
  amenities,
}: PlaceDetailAmenitiesSectionProps) {
  if (amenities.length === 0) return null;

  const seen = new Set<string>();
  const uniqueAmenities = amenities.filter((amenity) => {
    const key = amenity.label.toLocaleLowerCase("tr-TR");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return (
    <div className="space-y-5 border-t pt-8">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold">Olanaklar</h3>
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {uniqueAmenities.length} özellik
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {uniqueAmenities.map((amenity) => (
          <div
            key={amenity.label}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-accent/30"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              {renderAmenityIcon(amenity.icon)}
            </span>
            <span className="text-sm font-medium text-foreground">{amenity.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

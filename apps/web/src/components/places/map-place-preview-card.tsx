"use client";

import Image from "next/image";
import { Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getPlaceKindLabel, getPlacePriceUnitLabel } from "@/lib/place-kind";
import { getPlaceFeatureLabel } from "@/lib/place-feature";
import type { PlaceSummary } from "@/types";

type MapPlacePreviewCardProps = {
  place: PlaceSummary;
  onViewPlace?: (placeId: string) => void;
};

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

export function MapPlacePreviewCard({
  place,
  onViewPlace,
}: MapPlacePreviewCardProps) {
  const kindLabel = getPlaceKindLabel(
    place.kindName || place.kindSlug || place.kind,
    place.type,
  );
  const locationLabel = [place.district, place.city].filter(Boolean).join(", ");
  const hasPrice = Number(place.nightlyPrice) > 0;
  const priceUnitLabel = getPlacePriceUnitLabel(place.kind);
  const featureTags = (place.features ?? [])
    .slice(0, 3)
    .map((feature) => getPlaceFeatureLabel(feature))
    .filter(Boolean);

  return (
    <div className="w-[304px] overflow-hidden rounded-[20px] bg-white shadow-soft">
      <div className="relative h-44 w-full overflow-hidden">
        <Image
          src={place.imageUrl}
          alt={place.name}
          fill
          className="object-cover"
          sizes="308px"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
      </div>

      <div className="px-4 pb-5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <p className="line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {kindLabel}
            {locationLabel ? ` · ${locationLabel}` : ""}
          </p>
          {place.rating > 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-foreground px-2 py-1 text-[11px] font-semibold text-background">
              <Star className="h-3.5 w-3.5 fill-current text-foreground" />
              <span>{place.rating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>

        <h4 className="mt-2 line-clamp-2 text-[20px] font-semibold leading-[1.2] tracking-tight text-foreground">
          {place.name}
        </h4>

        {place.shortDescription ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {place.shortDescription}
          </p>
        ) : null}

        {featureTags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {featureTags.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <div className="space-y-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Başlangıç
            </p>
            {hasPrice ? (
              <p className="text-[20px] font-semibold leading-none tracking-tight text-foreground">
                {priceFormatter.format(place.nightlyPrice)}
                <span className="ml-1 text-sm font-semibold text-muted-foreground">
                  {priceUnitLabel}
                </span>
              </p>
            ) : (
              <p className="text-xs font-semibold text-muted-foreground">
                Fiyat bilgisi yok
              </p>
            )}
          </div>

          {onViewPlace ? (
            <Button
              size="sm"
              className="h-10 rounded-full bg-primary px-5 text-sm font-semibold shadow-sm hover:bg-primary/90"
              onClick={() => onViewPlace(place.id)}
            >
              Detayı Gör
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

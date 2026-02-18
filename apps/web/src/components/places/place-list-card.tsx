"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import {
  getPlaceKindLabel,
  getPlacePriceUnitLabel,
} from "@/lib/place-kind";
import { getPlaceFeatureLabel } from "@/lib/place-feature";
import { useLocalizedFormatting } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PlaceSummary } from "@/types";

type PlaceListCardProps = {
  place: PlaceSummary;
  onFavoriteClick?: (id: string) => void;
  isFavorite?: boolean;
  isHovered?: boolean;
  onHover?: (id: string | null) => void;
};

export function PlaceListCard({
  place,
  onFavoriteClick,
  isFavorite = false,
  isHovered = false,
  onHover,
}: PlaceListCardProps) {
  const { formatPrice } = useLocalizedFormatting();

  const kindLabel = getPlaceKindLabel(place.kindName || place.kindSlug || place.kind, place.type);
  const hasPrice = Number(place.nightlyPrice) > 0;
  const priceUnitLabel = getPlacePriceUnitLabel(place.kind);
  const displayedAmenities = (place.features ?? [])
    .slice(0, 3)
    .map((feature) => getPlaceFeatureLabel(feature))
    .filter(Boolean);

  return (
    <Link
      href={`/places/${place.slug}` as Route}
      className={cn(
        "group flex flex-col gap-4 rounded-xl border border-transparent bg-white p-4 transition-all hover:border-gray-200 hover:shadow-lg lg:flex-row lg:gap-6",
        isHovered && "border-gray-200 shadow-lg",
      )}
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl lg:h-[150px] lg:w-[200px] lg:aspect-auto">
        <Image
          src={place.imageUrl}
          alt={place.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 1024px) 100vw, 200px"
        />
        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavoriteClick?.(place.id);
          }}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm transition-all hover:scale-110 hover:bg-white"
        >
          <Heart
            className={cn(
              "size-5 transition-colors",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-700",
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-3">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1">
              <p className="text-sm text-gray-500">
                {kindLabel} - {place.city}
              </p>
              <h3 className="text-lg font-medium text-gray-800 group-hover:text-gray-900 lg:text-xl">
                {place.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden h-px w-10 bg-gray-200 lg:block" />

        {/* Details */}
        <div className="space-y-1">
          <p className="line-clamp-1 text-sm text-gray-500">
            {place.shortDescription}
          </p>
          {displayedAmenities.length > 0 && (
            <p className="line-clamp-1 text-sm text-gray-500">
              {displayedAmenities.join(" · ")}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="hidden h-px w-10 bg-gray-200 lg:block" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Rating */}
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-gray-700">
              {place.rating.toFixed(1)}
            </span>
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="text-sm text-gray-500">
              ({place.reviewCount} yorum)
            </span>
          </div>

          {/* Price */}
          {hasPrice ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-medium text-gray-800">
                {formatPrice(place.nightlyPrice)}
              </span>
              <span className="text-sm text-gray-500">{priceUnitLabel}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-500">Fiyat belirtilmedi</span>
          )}
        </div>
      </div>
    </Link>
  );
}

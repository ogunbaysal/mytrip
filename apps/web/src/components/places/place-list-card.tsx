"use client";

import { Heart, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { useLocalizedFormatting } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { PlaceSummary } from "@/types";

const PLACE_TYPE_LABELS: Record<string, string> = {
  stay: "Konaklama",
  hotel: "Otel",
  experience: "Deneyim",
  restaurant: "Restoran",
  cafe: "Kafe",
  activity: "Aktivite",
  attraction: "Gezi Yeri",
};

const AMENITY_LABELS: Record<string, string> = {
  wifi: "Wifi",
  parking: "Otopark",
  free_parking: "Ücretsiz Otopark",
  pool: "Havuz",
  kitchen: "Mutfak",
  air_conditioning: "Klima",
  washer: "Çamaşır Makinesi",
  dryer: "Kurutma Makinesi",
  tv: "TV",
  breakfast: "Kahvaltı",
  spa: "Spa",
  gym: "Spor Salonu",
  sea_view: "Deniz Manzarası",
  beach_access: "Plaj Erişimi",
  balcony: "Balkon",
  terrace: "Teras",
  garden: "Bahçe",
  pet_friendly: "Evcil Hayvan Dostu",
};

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

  const typeLabel = PLACE_TYPE_LABELS[place.type] ?? place.type;
  const displayedAmenities = (place.features ?? [])
    .slice(0, 3)
    .map(
      (f) =>
        AMENITY_LABELS[f] ||
        f.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
    );

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
                {typeLabel} - {place.city}
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
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-medium text-gray-800">
              {formatPrice(place.nightlyPrice)}
            </span>
            <span className="text-sm text-gray-500">/gece</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

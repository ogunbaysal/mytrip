"use client";

import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { useLocalizedFormatting } from "@/lib/i18n";
import type { PlaceSummary } from "@/types";

const PRICE_PREFIX = "başlayan";
const PER_NIGHT = "gece";

export function PlaceCard({ place }: { place: PlaceSummary }) {
  const { formatPrice } = useLocalizedFormatting();

  return (
    <Link
      href={`/places/${place.slug}` as Route}
      className="group block overflow-hidden rounded-3xl border border-transparent bg-white shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={place.imageUrl}
          alt={place.name}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 384px"
        />
        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-foreground shadow">
          {place.city}
        </div>
      </div>
      <div className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">{place.name}</h3>
          <span className="text-sm font-medium text-muted-foreground">
            ★ {place.rating.toFixed(1)} ({place.reviewCount})
          </span>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{place.shortDescription}</p>
        <div className="flex items-baseline gap-1 text-sm font-semibold text-foreground">
          <span>{PRICE_PREFIX}</span>
          <span>{formatPrice(place.nightlyPrice)}</span>
          <span className="text-xs font-medium text-muted-foreground">{PER_NIGHT}</span>
        </div>
      </div>
    </Link>
  );
}

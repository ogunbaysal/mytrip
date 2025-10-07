"use client";

import { useMemo } from "react";

import { LoaderCircle } from "lucide-react";

import { useFeaturedPlaces } from "@/hooks/use-featured-content";

import { PlaceCard } from "./place-card";

const SECTION_TITLE = "Öne çıkan konaklamalar";
const SECTION_SUBTITLE = "Misafir yorumlarıyla öne çıkan, özenle seçilmiş evler.";

export function FeaturedPlacesSection() {
  const { data, isLoading } = useFeaturedPlaces();

  const places = useMemo(() => data ?? [], [data]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{SECTION_TITLE}</h2>
          <p className="max-w-2xl text-base text-muted-foreground">{SECTION_SUBTITLE}</p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center rounded-3xl border border-dashed border-border/70 bg-white/70 py-12">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {places.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      )}
    </section>
  );
}

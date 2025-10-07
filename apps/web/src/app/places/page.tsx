"use client";

import { useMemo } from "react";

import { PlaceCard } from "@/components/places/place-card";
import { PlaceSearchForm } from "@/components/places/place-search-form";
import { PlacesMap } from "@/components/places/places-map";
import { usePlaces } from "@/hooks/use-places";
import { useAppStore } from "@/stores/app-store";

export default function PlacesPage() {
  const { data, isLoading } = usePlaces();
  const filters = useAppStore((state) => state.searchFilters);

  const filteredPlaces = useMemo(() => {
    const source = data ?? [];
    const locationQuery = filters.location?.trim().toLowerCase();
    return source.filter((place) => {
      const matchesType =
        filters.stayType === "all" ? true : place.type === filters.stayType;

      const matchesLocation = locationQuery
        ? `${place.city} ${place.district}`.toLowerCase().includes(locationQuery)
        : true;

      return matchesType && matchesLocation;
    });
  }, [data, filters.location, filters.stayType]);

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 pb-24 pt-10 md:px-6 md:pt-14 lg:flex-row">
      <div className="flex w-full flex-col gap-6 lg:w-[55%]">
        <div className="rounded-3xl border border-border bg-white/90 p-4 shadow-sm shadow-black/5">
          <div className="mb-4 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Konaklama ve deneyimleri filtrele</h1>
            <p className="text-sm text-muted-foreground">
              Muğla&apos;da aradığınız deneyimi bulmak için filtreleri kullanın.
            </p>
          </div>
          <PlaceSearchForm />
        </div>

        <div className="space-y-3">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Sonuçlar</h2>
            <span className="text-sm text-muted-foreground">
              {isLoading ? "Yükleniyor..." : `${filteredPlaces.length} sonuç bulundu`}
            </span>
          </div>
          <div className="grid gap-4">
            {filteredPlaces.length === 0 && !isLoading ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-white p-8 text-center text-sm text-muted-foreground">
                Aramanızla eşleşen sonuç bulunamadı. Filtreleri değiştirip tekrar deneyin.
              </div>
            ) : (
              filteredPlaces.map((place) => <PlaceCard key={place.id} place={place} />)
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-24 hidden h-[600px] flex-1 overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5 lg:block">
        <PlacesMap places={filteredPlaces} />
      </div>

      <div className="lg:hidden">
        <div className="mt-6 h-[420px] overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5">
          <PlacesMap places={filteredPlaces} />
        </div>
      </div>
    </div>
  );
}

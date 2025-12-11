"use client";

import { useSearchParams } from "next/navigation";

import { PlaceCard } from "@/components/places/place-card";
import { PlaceSearchForm } from "@/components/places/place-search-form";
import { PlacesMap } from "@/components/places/places-map";
import { usePlaces } from "@/hooks/use-places";

import { Suspense } from "react";

function PlacesContent() {
  const searchParams = useSearchParams();
  const filters = {
      search: searchParams.get("search") || "",
      city: searchParams.get("city") || "",
      district: searchParams.get("district") || "",
      type: searchParams.get("type") || "",
  };

  const { data, isLoading } = usePlaces(filters);
  const places = data ?? [];

  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-4 pb-24 pt-10 md:px-6 md:pt-14 lg:flex-row">
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
              {isLoading ? "Yükleniyor..." : `${places.length} sonuç bulundu`}
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {places.length === 0 && !isLoading ? (
              <div className="rounded-3xl border border-dashed border-border/70 bg-white p-8 text-center text-sm text-muted-foreground">
                Aramanızla eşleşen sonuç bulunamadı. Filtreleri değiştirip tekrar deneyin.
              </div>
            ) : (
              places.map((place) => <PlaceCard key={place.id} place={place} />)
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-24 hidden h-[600px] flex-1 overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5 lg:block">
        <PlacesMap places={places} />
      </div>

      <div className="lg:hidden">
        <div className="mt-6 h-[420px] overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5">
          <PlacesMap places={places} />
        </div>
      </div>
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10">Yükleniyor...</div>}>
      <PlacesContent />
    </Suspense>
  );
}

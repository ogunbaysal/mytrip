"use client";

import { useSearchParams } from "next/navigation";

import { PlaceCard } from "@/components/places/place-card";
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
      season: searchParams.get("season") || "",
      guests: searchParams.get("guests") ? parseInt(searchParams.get("guests") || "0") : undefined,
      checkIn: searchParams.get("checkIn") || "",
      checkOut: searchParams.get("checkOut") || "",
      priceMin: searchParams.get("priceMin") ? parseInt(searchParams.get("priceMin") || "0") : undefined,
      priceMax: searchParams.get("priceMax") ? parseInt(searchParams.get("priceMax") || "0") : undefined,
      sort: searchParams.get("sort") || "recommended",
  };

  const { data, isLoading } = usePlaces(filters);
  const places = data ?? [];
  
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full flex-col gap-6 px-4 py-6 md:px-8 lg:flex-row lg:py-10">
        <div className="flex w-full flex-col gap-6 lg:w-[55%]">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Sonuçlar</h1>
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

        <div className="sticky top-24 hidden h-[600px] flex-1 overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5 lg:block">
          <PlacesMap places={places} />
        </div>

        <div className="lg:hidden">
          <div className="mt-6 h-[420px] overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5">
            <PlacesMap places={places} />
          </div>
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

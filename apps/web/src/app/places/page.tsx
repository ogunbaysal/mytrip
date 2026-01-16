"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, useEffect } from "react";

import { FiltersModal } from "@/components/places/filters-modal";
import { PlaceListCard } from "@/components/places/place-list-card";
import { PlacesFilterBar } from "@/components/places/places-filter-bar";
import { PlacesMap } from "@/components/places/places-map";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaces, type PlaceFilters } from "@/hooks/use-places";

function PlacesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse filters from URL
  const getFiltersFromUrl = useCallback((): PlaceFilters => {
    return {
      search: searchParams.get("search") || undefined,
      city: searchParams.get("city") || undefined,
      district: searchParams.get("district") || undefined,
      type: searchParams.get("type") || undefined,
      season: searchParams.get("season") || undefined,
      guests: searchParams.get("guests")
        ? parseInt(searchParams.get("guests") || "0")
        : undefined,
      checkIn: searchParams.get("checkIn") || undefined,
      checkOut: searchParams.get("checkOut") || undefined,
      priceMin: searchParams.get("priceMin")
        ? parseInt(searchParams.get("priceMin") || "0")
        : undefined,
      priceMax: searchParams.get("priceMax")
        ? parseInt(searchParams.get("priceMax") || "0")
        : undefined,
      sort: searchParams.get("sort") || "recommended",
      amenities: searchParams.get("amenities")
        ? searchParams.get("amenities")!.split(",")
        : undefined,
      featured: searchParams.get("featured") === "true" || undefined,
      verified: searchParams.get("verified") === "true" || undefined,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState<PlaceFilters>(getFiltersFromUrl);
  const [hoveredPlaceId, setHoveredPlaceId] = useState<string | null>(null);
  const [searchAsMove, setSearchAsMove] = useState(false);
  const [mapBounds, setMapBounds] = useState<{
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  } | null>(null);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  // Update filters when URL changes
  useEffect(() => {
    setFilters(getFiltersFromUrl());
  }, [getFiltersFromUrl]);

  // Construct final filters including map bounds if search-as-move is enabled
  const finalFilters: PlaceFilters = {
    ...filters,
    bounds: searchAsMove && mapBounds ? mapBounds : undefined,
  };

  const { data, isLoading } = usePlaces(finalFilters);
  const places = data ?? [];

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: Partial<PlaceFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (
          value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0)
        ) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(","));
        } else {
          params.set(key, String(value));
        }
      });

      router.push(`/places?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const handleTypeChange = (type: string | undefined) => {
    const newFilters = { ...filters, type };
    setFilters(newFilters);
    updateUrl({ type });
  };

  const handlePriceChange = (
    priceMin: number | undefined,
    priceMax: number | undefined,
  ) => {
    const newFilters = { ...filters, priceMin, priceMax };
    setFilters(newFilters);
    updateUrl({ priceMin, priceMax });
  };

  const handleAmenitiesChange = (amenities: string[]) => {
    const newFilters = {
      ...filters,
      amenities: amenities.length > 0 ? amenities : undefined,
    };
    setFilters(newFilters);
    updateUrl({ amenities: amenities.length > 0 ? amenities : undefined });
  };

  const handleBoundsChange = (bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => {
    setMapBounds(bounds);
  };

  const handleFiltersModalApply = (modalFilters: {
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities: string[];
    featuredOnly?: boolean;
    verifiedOnly?: boolean;
  }) => {
    const newFilters: PlaceFilters = {
      ...filters,
      type: modalFilters.type,
      priceMin: modalFilters.minPrice,
      priceMax: modalFilters.maxPrice,
      amenities:
        modalFilters.amenities.length > 0 ? modalFilters.amenities : undefined,
      featured: modalFilters.featuredOnly,
      verified: modalFilters.verifiedOnly,
    };
    setFilters(newFilters);
    updateUrl({
      type: modalFilters.type,
      priceMin: modalFilters.minPrice,
      priceMax: modalFilters.maxPrice,
      amenities:
        modalFilters.amenities.length > 0 ? modalFilters.amenities : undefined,
      featured: modalFilters.featuredOnly,
      verified: modalFilters.verifiedOnly,
    });
  };

  const handlePlaceClick = (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      router.push(`/places/${place.slug}`);
    }
  };

  // Results count text
  const cityName = filters.city || "tüm bölgeler";
  const resultsText = isLoading
    ? "Yükleniyor..."
    : places.length === 0
      ? "Sonuç bulunamadı"
      : `${places.length}+ konaklama - ${cityName}`;

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col">
      {/* Filter Bar */}
      <PlacesFilterBar
        selectedType={filters.type}
        onTypeChange={handleTypeChange}
        minPrice={filters.priceMin}
        maxPrice={filters.priceMax}
        onPriceChange={handlePriceChange}
        selectedAmenities={filters.amenities ?? []}
        onAmenitiesChange={handleAmenitiesChange}
        onFiltersClick={() => setIsFiltersModalOpen(true)}
      />

      {/* Filters Modal */}
      <FiltersModal
        open={isFiltersModalOpen}
        onOpenChange={setIsFiltersModalOpen}
        selectedType={filters.type}
        minPrice={filters.priceMin}
        maxPrice={filters.priceMax}
        selectedAmenities={filters.amenities ?? []}
        featuredOnly={filters.featured}
        verifiedOnly={filters.verified}
        onApply={handleFiltersModalApply}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Listings */}
        <div className="flex w-full flex-col lg:w-[58%]">
          {/* Results count */}
          <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
            <p className="text-base text-gray-500">{resultsText}</p>
          </div>

          {/* Listings scroll area */}
          <ScrollArea className="flex-1">
            <div className="divide-y divide-gray-100 px-6">
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="py-4">
                    <div className="flex animate-pulse gap-6">
                      <div className="h-[150px] w-[200px] shrink-0 rounded-xl bg-gray-200" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 w-24 rounded bg-gray-200" />
                        <div className="h-6 w-48 rounded bg-gray-200" />
                        <div className="h-px w-10 bg-gray-200" />
                        <div className="h-4 w-full rounded bg-gray-200" />
                        <div className="h-4 w-3/4 rounded bg-gray-200" />
                        <div className="h-px w-10 bg-gray-200" />
                        <div className="flex justify-between">
                          <div className="h-4 w-32 rounded bg-gray-200" />
                          <div className="h-5 w-24 rounded bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : places.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-gray-500">
                    Aramanızla eşleşen sonuç bulunamadı.
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Filtreleri değiştirip tekrar deneyin.
                  </p>
                </div>
              ) : (
                places.map((place) => (
                  <div key={place.id} className="py-4">
                    <PlaceListCard
                      place={place}
                      isHovered={hoveredPlaceId === place.id}
                      onHover={setHoveredPlaceId}
                    />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Map (Desktop only) */}
        <div className="hidden flex-1 lg:block">
          <div className="h-full w-full">
            <PlacesMap
              places={places}
              hoveredPlaceId={hoveredPlaceId}
              onPlaceClick={handlePlaceClick}
              onPlaceHover={setHoveredPlaceId}
              searchAsMove={searchAsMove}
              onSearchAsMoveChange={setSearchAsMove}
              onBoundsChange={handleBoundsChange}
            />
          </div>
        </div>
      </div>

      {/* Mobile Map - Show below on mobile/tablet */}
      <div className="border-t border-gray-200 lg:hidden">
        <div className="h-[350px] w-full">
          <PlacesMap
            places={places}
            hoveredPlaceId={hoveredPlaceId}
            onPlaceClick={handlePlaceClick}
            onPlaceHover={setHoveredPlaceId}
            searchAsMove={searchAsMove}
            onSearchAsMoveChange={setSearchAsMove}
            onBoundsChange={handleBoundsChange}
          />
        </div>
      </div>
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-80px)] items-center justify-center">
          <div className="text-sm text-gray-500">Yükleniyor...</div>
        </div>
      }
    >
      <PlacesContent />
    </Suspense>
  );
}

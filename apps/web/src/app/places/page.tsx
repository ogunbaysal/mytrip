"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useState, useEffect } from "react";
import { List, Map } from "lucide-react";

import { FiltersModal } from "@/components/places/filters-modal";
import { PlaceListCard } from "@/components/places/place-list-card";
import { PlacesFilterBar } from "@/components/places/places-filter-bar";
import { PlacesMap } from "@/components/places/places-map";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePlaces, type PlaceFilters } from "@/hooks/use-places";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 12;

const parsePositiveInt = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const buildPaginationSequence = (current: number, total: number) => {
  if (total <= 1) return [];
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = Array.from(pages).filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const sequence: Array<number | "..."> = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      sequence.push("...");
    }
    sequence.push(sorted[i]);
  }

  return sequence;
};

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
      page: parsePositiveInt(searchParams.get("page"), DEFAULT_PAGE),
      limit: parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT),
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
  const [mobileView, setMobileView] = useState<"list" | "map">("list");

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
  const places = data?.places ?? [];
  const pagination = data?.pagination ?? {
    page: filters.page ?? DEFAULT_PAGE,
    limit: filters.limit ?? DEFAULT_LIMIT,
    total: places.length,
    totalPages: 0,
  };
  const totalPages = pagination.totalPages;
  const currentPage =
    totalPages > 0
      ? Math.min(Math.max(filters.page ?? DEFAULT_PAGE, 1), totalPages)
      : DEFAULT_PAGE;

  // Update URL when filters change
  const updateUrl = useCallback(
    (newFilters: Partial<PlaceFilters>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(newFilters).forEach(([key, value]) => {
        if (key === "page" && Number(value) <= DEFAULT_PAGE) {
          params.delete("page");
          return;
        }
        if (key === "limit" && Number(value) === DEFAULT_LIMIT) {
          params.delete("limit");
          return;
        }

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
    const newFilters = { ...filters, type, page: DEFAULT_PAGE };
    setFilters(newFilters);
    updateUrl({ type, page: DEFAULT_PAGE });
  };

  const handlePriceChange = (
    priceMin: number | undefined,
    priceMax: number | undefined,
  ) => {
    const newFilters = { ...filters, priceMin, priceMax, page: DEFAULT_PAGE };
    setFilters(newFilters);
    updateUrl({ priceMin, priceMax, page: DEFAULT_PAGE });
  };

  const handleAmenitiesChange = (amenities: string[]) => {
    const newFilters = {
      ...filters,
      amenities: amenities.length > 0 ? amenities : undefined,
      page: DEFAULT_PAGE,
    };
    setFilters(newFilters);
    updateUrl({
      amenities: amenities.length > 0 ? amenities : undefined,
      page: DEFAULT_PAGE,
    });
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
      page: DEFAULT_PAGE,
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
      page: DEFAULT_PAGE,
    });
  };

  const handlePageChange = (page: number) => {
    if (page === currentPage || page < 1 || (totalPages > 0 && page > totalPages)) {
      return;
    }
    setFilters((prev) => ({ ...prev, page }));
    updateUrl({ page });
  };

  useEffect(() => {
    if (isLoading) return;
    if (totalPages === 0 && (filters.page ?? DEFAULT_PAGE) !== DEFAULT_PAGE) {
      setFilters((prev) => ({ ...prev, page: DEFAULT_PAGE }));
      updateUrl({ page: DEFAULT_PAGE });
      return;
    }
    if (totalPages > 0 && (filters.page ?? DEFAULT_PAGE) > totalPages) {
      setFilters((prev) => ({ ...prev, page: totalPages }));
      updateUrl({ page: totalPages });
    }
  }, [filters.page, isLoading, totalPages, updateUrl]);

  const handlePlaceClick = (placeId: string) => {
    const place = places.find((p) => p.id === placeId);
    if (place) {
      router.push(`/places/${place.slug}`);
    }
  };

  // Results count text
  const cityName = filters.city || "tüm bölgeler";
  const totalResults = pagination.total ?? places.length;
  const resultsText = isLoading
    ? "Yükleniyor..."
    : totalResults === 0
      ? "Sonuç bulunamadı"
      : `${totalResults} konaklama - ${cityName}`;

  const listingContent = isLoading ? (
    Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="py-4">
        <div className="flex animate-pulse flex-col gap-4 sm:flex-row sm:gap-6">
          <div className="h-[190px] w-full shrink-0 rounded-xl bg-gray-200 sm:h-[150px] sm:w-[200px]" />
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
      <p className="text-gray-500">Aramanızla eşleşen sonuç bulunamadı.</p>
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
  );

  const paginationSequence = buildPaginationSequence(currentPage, totalPages);
  const renderPaginationControls = () => {
    if (isLoading || totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between gap-2 py-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg"
        >
          Önceki
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {paginationSequence.map((item, index) =>
            item === "..." ? (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-sm text-gray-400"
              >
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => handlePageChange(item)}
                className={`h-8 min-w-8 rounded-md px-2 text-sm transition ${
                  item === currentPage
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ),
          )}
        </div>

        <span className="text-xs text-gray-500 sm:hidden">
          Sayfa {currentPage}/{totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="rounded-lg"
        >
          Sonraki
        </Button>
      </div>
    );
  };

  return (
    <div className="flex h-[calc(100dvh-80px)] min-h-0 flex-col">
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

      {/* Mobile view switch */}
      <div className="border-b border-gray-100 bg-white px-4 py-2 lg:hidden">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mobileView === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <List className="size-4" />
            Liste
          </button>
          <button
            type="button"
            onClick={() => setMobileView("map")}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              mobileView === "map"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            <Map className="size-4" />
            Harita
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="min-h-0 flex flex-1 overflow-hidden">
        {/* Desktop layout */}
        <div className="hidden h-full flex-1 overflow-hidden lg:flex">
          <div className="flex w-[58%] min-w-0 flex-col">
            <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-4">
              <p className="text-base text-gray-500">{resultsText}</p>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="divide-y divide-gray-100 px-6">
                {listingContent}
              </div>
              <div className="px-6">{renderPaginationControls()}</div>
            </ScrollArea>
          </div>

          <div className="min-w-0 flex-1">
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

        {/* Mobile layout */}
        <div className="flex h-full w-full flex-1 flex-col lg:hidden">
          {mobileView === "list" ? (
            <>
              <div className="shrink-0 border-b border-gray-100 bg-white px-4 py-3">
                <p className="text-base text-gray-500">{resultsText}</p>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-gray-100 px-4 pb-20">
                  {listingContent}
                </div>
                <div className="px-4">{renderPaginationControls()}</div>
              </div>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}

export default function PlacesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-80px)] items-center justify-center">
          <div className="text-sm text-gray-500">Yükleniyor...</div>
        </div>
      }
    >
      <PlacesContent />
    </Suspense>
  );
}

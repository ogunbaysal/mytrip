"use client";

import { SlidersHorizontal } from "lucide-react";
import { useRef, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useAmenities } from "@/hooks/use-amenities";
import { cn } from "@/lib/utils";

import { AmenityToggle } from "./amenity-toggle";
import { PriceFilterPopover } from "./price-filter-popover";
import { TypeFilterPopover } from "./type-filter-popover";

type PlacesFilterBarProps = {
  selectedType?: string;
  onTypeChange: (type: string | undefined) => void;
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min: number | undefined, max: number | undefined) => void;
  selectedAmenities: string[];
  onAmenitiesChange: (amenities: string[]) => void;
  onFiltersClick?: () => void;
};

export function PlacesFilterBar({
  selectedType,
  onTypeChange,
  minPrice,
  maxPrice,
  onPriceChange,
  selectedAmenities,
  onAmenitiesChange,
  onFiltersClick,
}: PlacesFilterBarProps) {
  const { data: amenities = [] } = useAmenities();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  // Check scroll position for shadow effects
  useEffect(() => {
    const checkScroll = () => {
      if (!scrollRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftShadow(scrollLeft > 0);
      setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 5);
    };

    const scrollElement = scrollRef.current;
    if (scrollElement) {
      checkScroll();
      scrollElement.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener("scroll", checkScroll);
      }
      window.removeEventListener("resize", checkScroll);
    };
  }, [amenities]);

  const toggleAmenity = (key: string) => {
    if (selectedAmenities.includes(key)) {
      onAmenitiesChange(selectedAmenities.filter((a) => a !== key));
    } else {
      onAmenitiesChange([...selectedAmenities, key]);
    }
  };

  const activeFiltersCount =
    (selectedType ? 1 : 0) +
    (minPrice !== undefined || maxPrice !== undefined ? 1 : 0) +
    selectedAmenities.length;

  // Show top 10 most common amenities
  const displayedAmenities = amenities.slice(0, 10);
  const mobileAmenities = displayedAmenities.slice(0, 6);

  return (
    <div className="w-full border-b border-gray-200 bg-white px-4 py-3 lg:px-6">
      {/* Mobile: single horizontal filter rail */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide md:hidden">
        <PriceFilterPopover
          minPrice={minPrice}
          maxPrice={maxPrice}
          onPriceChange={onPriceChange}
          triggerClassName="shrink-0"
        />
        <TypeFilterPopover
          selectedType={selectedType}
          onTypeChange={onTypeChange}
          triggerClassName="shrink-0"
        />
        {mobileAmenities.map((amenity) => (
          <AmenityToggle
            key={amenity.key}
            label={amenity.label}
            isSelected={selectedAmenities.includes(amenity.key)}
            onClick={() => toggleAmenity(amenity.key)}
          />
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={onFiltersClick}
          className="relative h-9 shrink-0 gap-2 rounded-full border-gray-200 bg-white px-4 text-sm shadow-sm hover:border-gray-300 hover:bg-gray-50"
        >
          <SlidersHorizontal className="size-4" />
          Filtreler
          {activeFiltersCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop */}
      <div className="hidden w-full items-center gap-4 md:flex">
        <div className="flex shrink-0 items-center gap-2">
          <PriceFilterPopover
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={onPriceChange}
          />
          <TypeFilterPopover
            selectedType={selectedType}
            onTypeChange={onTypeChange}
          />
        </div>

        <div className="h-6 w-px shrink-0 bg-gray-200" />

        <div className="relative flex-1 overflow-hidden">
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-white to-transparent transition-opacity",
              showLeftShadow ? "opacity-100" : "opacity-0",
            )}
          />

          <ScrollArea className="w-full" type="scroll">
            <div ref={scrollRef} className="flex items-center gap-2 pb-2">
              {displayedAmenities.map((amenity) => (
                <AmenityToggle
                  key={amenity.key}
                  label={amenity.label}
                  isSelected={selectedAmenities.includes(amenity.key)}
                  onClick={() => toggleAmenity(amenity.key)}
                />
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>

          <div
            className={cn(
              "pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-white to-transparent transition-opacity",
              showRightShadow ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onFiltersClick}
          className="h-9 shrink-0 gap-2 rounded-full border-gray-200 bg-white px-4 text-sm font-normal shadow-sm hover:border-gray-300 hover:bg-gray-50"
        >
          <SlidersHorizontal className="size-4" />
          Filtreler
          {activeFiltersCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-gray-900 text-xs font-medium text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

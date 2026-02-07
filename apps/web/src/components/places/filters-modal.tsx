"use client";

import { X, RotateCcw } from "lucide-react";
import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { useAmenities } from "@/hooks/use-amenities";
import { usePlaceTypes } from "@/hooks/use-place-types";
import { cn } from "@/lib/utils";

// Place type definitions with Turkish labels
const PLACE_TYPES = [
  { value: "hotel", label: "Konaklama" },
  { value: "restaurant", label: "Restoran" },
  { value: "cafe", label: "Kafe" },
  { value: "activity", label: "Aktivite" },
  { value: "attraction", label: "Gezi Yeri" },
] as const;

// Amenity groups for better organization
const AMENITY_GROUPS = {
  essentials: {
    label: "Temel Olanaklar",
    keys: ["wifi", "parking", "free_parking", "air_conditioning", "heating"],
  },
  facilities: {
    label: "Tesisler",
    keys: ["pool", "spa", "gym", "restaurant", "bar", "elevator"],
  },
  kitchen: {
    label: "Mutfak",
    keys: ["kitchen", "coffee_maker", "dishwasher", "microwave", "minibar"],
  },
  outdoor: {
    label: "Dış Mekan",
    keys: ["balcony", "terrace", "garden", "bbq", "sea_view", "beach_access"],
  },
  services: {
    label: "Hizmetler",
    keys: [
      "room_service",
      "concierge",
      "laundry",
      "breakfast",
      "free_cancellation",
    ],
  },
  comfort: {
    label: "Konfor",
    keys: [
      "tv",
      "fireplace",
      "safe",
      "washer",
      "dryer",
      "iron",
      "dedicated_workspace",
    ],
  },
  accessibility: {
    label: "Erisilebilirlik",
    keys: ["wheelchair_accessible", "pet_friendly", "family_friendly"],
  },
} as const;

type FiltersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Current filter values
  selectedType?: string;
  minPrice?: number;
  maxPrice?: number;
  selectedAmenities: string[];
  // Feature toggles
  featuredOnly?: boolean;
  verifiedOnly?: boolean;
  // Callbacks
  onApply: (filters: {
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    amenities: string[];
    featuredOnly?: boolean;
    verifiedOnly?: boolean;
  }) => void;
};

const PRICE_RANGE = { min: 0, max: 10000, step: 100 };

export function FiltersModal({
  open,
  onOpenChange,
  selectedType,
  minPrice,
  maxPrice,
  selectedAmenities,
  featuredOnly,
  verifiedOnly,
  onApply,
}: FiltersModalProps) {
  // Local state for editing filters before applying
  const [localType, setLocalType] = useState(selectedType);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>([
    minPrice ?? PRICE_RANGE.min,
    maxPrice ?? PRICE_RANGE.max,
  ]);
  const [localAmenities, setLocalAmenities] = useState<string[]>(
    selectedAmenities || [],
  );
  const [localFeatured, setLocalFeatured] = useState(featuredOnly ?? false);
  const [localVerified, setLocalVerified] = useState(verifiedOnly ?? false);

  // Sync local state when modal opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setLocalType(selectedType);
      setLocalPriceRange([
        minPrice ?? PRICE_RANGE.min,
        maxPrice ?? PRICE_RANGE.max,
      ]);
      setLocalAmenities(selectedAmenities || []);
      setLocalFeatured(featuredOnly ?? false);
      setLocalVerified(verifiedOnly ?? false);
    }
    onOpenChange(newOpen);
  };

  const { data: apiAmenities = [] } = useAmenities();
  const { data: placeTypeOptions = [] } = usePlaceTypes();
  const resolvedPlaceTypes =
    placeTypeOptions.length > 0
      ? placeTypeOptions.map((item) => ({
          value: item.type,
          label: item.name,
        }))
      : PLACE_TYPES;

  // Build amenity map from API data
  const amenityMap = useMemo(() => {
    const map: Record<string, { label: string; count: number }> = {};
    for (const amenity of apiAmenities) {
      map[amenity.key] = { label: amenity.label, count: amenity.count };
    }
    return map;
  }, [apiAmenities]);

  const toggleAmenity = (key: string) => {
    setLocalAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key],
    );
  };

  const handleReset = () => {
    setLocalType(undefined);
    setLocalPriceRange([PRICE_RANGE.min, PRICE_RANGE.max]);
    setLocalAmenities([]);
    setLocalFeatured(false);
    setLocalVerified(false);
  };

  const handleApply = () => {
    onApply({
      type: localType,
      minPrice:
        localPriceRange[0] > PRICE_RANGE.min ? localPriceRange[0] : undefined,
      maxPrice:
        localPriceRange[1] < PRICE_RANGE.max ? localPriceRange[1] : undefined,
      amenities: localAmenities,
      featuredOnly: localFeatured || undefined,
      verifiedOnly: localVerified || undefined,
    });
    onOpenChange(false);
  };

  // Count active filters
  const activeFiltersCount =
    (localType ? 1 : 0) +
    (localPriceRange[0] > PRICE_RANGE.min ||
    localPriceRange[1] < PRICE_RANGE.max
      ? 1
      : 0) +
    localAmenities.length +
    (localFeatured ? 1 : 0) +
    (localVerified ? 1 : 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        showCloseButton={false}
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between border-b border-gray-200 px-6 py-4">
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 hover:bg-gray-100"
          >
            <X className="size-5" />
          </button>
          <DialogTitle className="text-base font-semibold">
            Filtreler
          </DialogTitle>
          <div className="w-9" /> {/* Spacer for centering */}
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Price Range Section */}
          <section className="border-b border-gray-200 px-6 py-6">
            <h3 className="mb-2 text-lg font-semibold">Fiyat Araligi</h3>
            <p className="mb-6 text-sm text-gray-500">Gecelik fiyat (TL)</p>

            <div className="px-2">
              <Slider
                value={localPriceRange}
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                step={PRICE_RANGE.step}
                onValueChange={(value) =>
                  setLocalPriceRange(value as [number, number])
                }
                className="mb-4"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Minimum
                </label>
                <div className="flex items-center rounded-lg border border-gray-300 px-3 py-2">
                  <span className="text-sm text-gray-500">₺</span>
                  <input
                    type="number"
                    value={localPriceRange[0]}
                    onChange={(e) => {
                      const val = Math.max(
                        PRICE_RANGE.min,
                        Math.min(
                          parseInt(e.target.value) || 0,
                          localPriceRange[1],
                        ),
                      );
                      setLocalPriceRange([val, localPriceRange[1]]);
                    }}
                    className="ml-1 w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div className="mt-6 text-gray-400">-</div>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-gray-500">
                  Maksimum
                </label>
                <div className="flex items-center rounded-lg border border-gray-300 px-3 py-2">
                  <span className="text-sm text-gray-500">₺</span>
                  <input
                    type="number"
                    value={localPriceRange[1]}
                    onChange={(e) => {
                      const val = Math.min(
                        PRICE_RANGE.max,
                        Math.max(
                          parseInt(e.target.value) || 0,
                          localPriceRange[0],
                        ),
                      );
                      setLocalPriceRange([localPriceRange[0], val]);
                    }}
                    className="ml-1 w-full border-none bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Place Type Section */}
          <section className="border-b border-gray-200 px-6 py-6">
            <h3 className="mb-4 text-lg font-semibold">Mekan Tipi</h3>
            <div className="flex flex-wrap gap-2">
              {resolvedPlaceTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() =>
                    setLocalType(
                      localType === type.value ? undefined : type.value,
                    )
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    localType === type.value
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-900",
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </section>

          {/* Special Filters Section */}
          <section className="border-b border-gray-200 px-6 py-6">
            <h3 className="mb-4 text-lg font-semibold">Ozel Filtreler</h3>
            <div className="space-y-4">
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="font-medium">One Cikan Mekanlar</p>
                  <p className="text-sm text-gray-500">
                    Editoryel secim ve ozel mekanlar
                  </p>
                </div>
                <ToggleSwitch
                  checked={localFeatured}
                  onChange={setLocalFeatured}
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between">
                <div>
                  <p className="font-medium">Dogrulanmis Mekanlar</p>
                  <p className="text-sm text-gray-500">
                    TatilDesen tarafindan dogrulanmis
                  </p>
                </div>
                <ToggleSwitch
                  checked={localVerified}
                  onChange={setLocalVerified}
                />
              </label>
            </div>
          </section>

          {/* Amenities Section */}
          <section className="px-6 py-6">
            <h3 className="mb-4 text-lg font-semibold">Olanaklar</h3>

            {Object.entries(AMENITY_GROUPS).map(([groupKey, group]) => {
              // Filter to only show amenities that exist in API data
              const availableAmenities = group.keys.filter(
                (key) => amenityMap[key],
              );
              if (availableAmenities.length === 0) return null;

              return (
                <div key={groupKey} className="mb-6">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    {group.label}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {availableAmenities.map((key) => {
                      const amenity = amenityMap[key];
                      const isSelected = localAmenities.includes(key);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleAmenity(key)}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                            isSelected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:border-gray-400",
                          )}
                        >
                          <span
                            className={cn(
                              isSelected ? "font-medium" : "text-gray-700",
                            )}
                          >
                            {amenity.label}
                          </span>
                          {isSelected && (
                            <svg
                              className="size-5 text-gray-900"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Uncategorized amenities */}
            {(() => {
              const categorizedKeys: string[] = Object.values(
                AMENITY_GROUPS,
              ).flatMap((g) => [...g.keys] as string[]);
              const uncategorized = apiAmenities.filter(
                (a) => !categorizedKeys.includes(a.key),
              );
              if (uncategorized.length === 0) return null;

              return (
                <div className="mb-6">
                  <h4 className="mb-3 text-sm font-medium text-gray-700">
                    Diger
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {uncategorized.map((amenity) => {
                      const isSelected = localAmenities.includes(amenity.key);
                      return (
                        <button
                          key={amenity.key}
                          onClick={() => toggleAmenity(amenity.key)}
                          className={cn(
                            "flex items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors",
                            isSelected
                              ? "border-gray-900 bg-gray-50"
                              : "border-gray-200 hover:border-gray-400",
                          )}
                        >
                          <span
                            className={cn(
                              isSelected ? "font-medium" : "text-gray-700",
                            )}
                          >
                            {amenity.label}
                          </span>
                          {isSelected && (
                            <svg
                              className="size-5 text-gray-900"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm font-medium underline hover:text-gray-600"
          >
            <RotateCcw className="size-4" />
            Tumu Temizle
          </button>
          <Button onClick={handleApply} className="min-w-[120px] rounded-lg">
            {activeFiltersCount > 0
              ? `${activeFiltersCount} Filtre Uygula`
              : "Sonuclari Goster"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Toggle Switch Component
function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors",
        checked ? "bg-gray-900" : "bg-gray-200",
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-5 rounded-full bg-white shadow-md transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

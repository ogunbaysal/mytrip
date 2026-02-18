const TYPE_ALIASES: Record<string, string> = {
  stay: "hotel",
  experience: "activity",
  experiences: "activity",
  activities: "activity",
  dining: "restaurant",
  villa: "hotel",
  bar_club: "cafe",
  "bar-club": "cafe",
  natural_location: "attraction",
  "natural-location": "attraction",
  visit_location: "attraction",
  "visit-location": "attraction",
  beach: "attraction",
  other_monetized: "activity",
  "other-monetized": "activity",
};

const SUPPORTED_TYPES = new Set([
  "hotel",
  "restaurant",
  "cafe",
  "activity",
  "attraction",
  "transport",
]);

export function normalizePlaceTypeFilter(
  type?: string | null,
): string | undefined {
  if (!type) return undefined;
  const normalized = type.trim().toLowerCase();
  if (!normalized || normalized === "all") return undefined;

  const mapped = TYPE_ALIASES[normalized] ?? normalized;
  return SUPPORTED_TYPES.has(mapped) ? mapped : undefined;
}

export function normalizeAmenityFilterKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function normalizeAmenityFilterList(values: string[]): string[] {
  const normalized = values
    .map((value) => normalizeAmenityFilterKey(value))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

const TYPE_ALIASES: Record<string, string> = {
  experience: "activity",
  experiences: "activity",
  activities: "activity",
  villa: "stay",
  bungalow_tiny_house: "stay",
  hotel_pension: "stay",
  detached_house_apartment: "stay",
  camp_site: "stay",
  transfer: "activity",
  boat_tour: "activity",
  paragliding_microlight_skydiving: "activity",
  safari: "activity",
  water_sports: "activity",
  ski: "activity",
  balloon_tour: "activity",
};

const SUPPORTED_TYPES = new Set(["stay", "activity"]);

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

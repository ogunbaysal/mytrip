const PLACE_KIND_LABELS: Record<string, string> = {
  hotel: "Otel",
  villa: "Villa",
  restaurant: "Restoran",
  cafe: "Kafe",
  bar_club: "Bar / Club",
  beach: "Plaj",
  natural_location: "Doga Noktasi",
  activity_location: "Aktivite",
  visit_location: "Gezi Noktasi",
  other_monetized: "Diger Ucretli",
};

const FALLBACK_TYPE_LABELS: Record<string, string> = {
  stay: "Konaklama",
  experience: "Deneyim",
  restaurant: "Restoran",
  hotel: "Otel",
  cafe: "Kafe",
  activity: "Aktivite",
  attraction: "Gezi Yeri",
  transport: "Ulasim",
};

const STAY_KINDS = new Set(["hotel", "villa"]);
const DINING_KINDS = new Set(["restaurant", "cafe", "bar_club"]);
const MONETIZED_KINDS = new Set([
  "hotel",
  "villa",
  "restaurant",
  "cafe",
  "bar_club",
  "beach",
  "activity_location",
  "other_monetized",
]);

function toReadableKindLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

export function normalizePlaceKind(kind?: string | null): string {
  return (kind ?? "").trim().toLowerCase().replace(/-/g, "_");
}

export function getPlaceKindLabel(kind?: string | null, fallbackType?: string): string {
  const normalizedKind = normalizePlaceKind(kind);
  if (normalizedKind) {
    return PLACE_KIND_LABELS[normalizedKind] ?? toReadableKindLabel(normalizedKind);
  }

  const normalizedType = (fallbackType ?? "").trim().toLowerCase();
  return FALLBACK_TYPE_LABELS[normalizedType] ?? "Mekan";
}

export function isStayPlaceKind(kind?: string | null): boolean {
  return STAY_KINDS.has(normalizePlaceKind(kind));
}

export function isDiningPlaceKind(kind?: string | null): boolean {
  return DINING_KINDS.has(normalizePlaceKind(kind));
}

export function isMonetizedPlaceKind(kind?: string | null): boolean {
  return MONETIZED_KINDS.has(normalizePlaceKind(kind));
}

export function getPlacePriceUnitLabel(kind?: string | null): string {
  if (isStayPlaceKind(kind)) return "/gece";
  if (isDiningPlaceKind(kind)) return "ortalama";

  const normalizedKind = normalizePlaceKind(kind);
  if (normalizedKind === "activity_location") return "/kisi";

  return "baslangic";
}

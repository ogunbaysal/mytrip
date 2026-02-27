const PLACE_KIND_LABELS: Record<string, string> = {
  villa: "Villa",
  bungalow_tiny_house: "Bungalov & Tiny House",
  hotel_pension: "Otel & Pansiyon",
  detached_house_apartment: "Müstakil Ev & Daire",
  camp_site: "Kamp Alanı",
  transfer: "Transfer",
  boat_tour: "Tekne Turu",
  paragliding_microlight_skydiving: "Paraşüt & Microlight & Skydiving",
  safari: "Safari",
  water_sports: "Su Sporları",
  ski: "Kayak",
  balloon_tour: "Balon Turu",
};

const FALLBACK_TYPE_LABELS: Record<string, string> = {
  stay: "Konaklama",
  activity: "Aktivite",
};

const STAY_KINDS = new Set([
  "villa",
  "bungalow_tiny_house",
  "hotel_pension",
  "detached_house_apartment",
  "camp_site",
]);

const ACTIVITY_KINDS = new Set([
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
]);

const MONETIZED_KINDS = new Set([...STAY_KINDS, ...ACTIVITY_KINDS]);

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

export function isDiningPlaceKind(): boolean {
  return false;
}

export function isMonetizedPlaceKind(kind?: string | null): boolean {
  return MONETIZED_KINDS.has(normalizePlaceKind(kind));
}

export function isActivityPlaceKind(kind?: string | null): boolean {
  return ACTIVITY_KINDS.has(normalizePlaceKind(kind));
}

export function isRoomRequiredStayKind(kind?: string | null): boolean {
  return normalizePlaceKind(kind) === "hotel_pension";
}

export function getPlacePriceUnitLabel(kind?: string | null): string {
  if (isStayPlaceKind(kind)) return "/gece";
  if (isActivityPlaceKind(kind)) return "/paket";
  return "baslangic";
}

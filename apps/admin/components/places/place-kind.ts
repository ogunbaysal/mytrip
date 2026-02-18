import { Place, PlaceKind, PlaceKindId } from "@/hooks/use-places";

export const PLACE_KIND_LABELS: Record<PlaceKindId, string> = {
  hotel: "Otel",
  villa: "Villa",
  restaurant: "Restoran",
  cafe: "Kafe",
  bar_club: "Bar / Kulüp",
  beach: "Plaj",
  natural_location: "Doğal Lokasyon",
  activity_location: "Aktivite Lokasyonu",
  visit_location: "Gezi Noktası",
  other_monetized: "Diğer Ücretli",
};

export const getPlaceKindLabel = (
  kind: string | undefined,
  fallbackName?: string | null,
) => {
  if (!kind) return fallbackName || "-";
  const fromMap = PLACE_KIND_LABELS[kind as PlaceKindId];
  return fromMap || fallbackName || kind;
};

export const resolvePlaceKindFromPlace = (place: Place): string =>
  place.kind || place.categoryId || place.kindSlug || "";

export const toPlaceKindOption = (kind: PlaceKind) => ({
  value: kind.id,
  label: getPlaceKindLabel(kind.id, kind.name),
});

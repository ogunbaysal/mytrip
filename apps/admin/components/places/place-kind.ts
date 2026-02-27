import { Place, PlaceKind, PlaceKindId } from "@/hooks/use-places";

export const PLACE_KIND_LABELS: Record<PlaceKindId, string> = {
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

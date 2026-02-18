export const PLACE_KIND_IDS = [
  "hotel",
  "villa",
  "restaurant",
  "cafe",
  "bar_club",
  "beach",
  "natural_location",
  "activity_location",
  "visit_location",
  "other_monetized",
] as const;

export type PlaceKindId = (typeof PLACE_KIND_IDS)[number];

export const DINING_PLACE_KINDS: PlaceKindId[] = [
  "restaurant",
  "cafe",
  "bar_club",
];

export const ROOM_SUPPORTED_PLACE_KINDS: PlaceKindId[] = ["hotel"];

export const PACKAGE_SUPPORTED_PLACE_KINDS: PlaceKindId[] = ["activity_location"];

export const isPlaceKind = (value: string): value is PlaceKindId =>
  (PLACE_KIND_IDS as readonly string[]).includes(value);

export const supportsRoomsForKind = (kind: string): boolean =>
  ROOM_SUPPORTED_PLACE_KINDS.includes(kind as PlaceKindId);

export const supportsMenuForKind = (kind: string): boolean =>
  DINING_PLACE_KINDS.includes(kind as PlaceKindId);

export const supportsPackagesForKind = (kind: string): boolean =>
  PACKAGE_SUPPORTED_PLACE_KINDS.includes(kind as PlaceKindId);

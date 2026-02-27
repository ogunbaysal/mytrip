export const PLACE_KIND_IDS = [
  "villa",
  "bungalow_tiny_house",
  "hotel_pension",
  "detached_house_apartment",
  "camp_site",
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
] as const;

export type PlaceKindId = (typeof PLACE_KIND_IDS)[number];

export const STAY_PLACE_KINDS: PlaceKindId[] = [
  "villa",
  "bungalow_tiny_house",
  "hotel_pension",
  "detached_house_apartment",
  "camp_site",
];

export const ROOM_REQUIRED_PLACE_KINDS: PlaceKindId[] = ["hotel_pension"];

export const ROOM_SUPPORTED_PLACE_KINDS: PlaceKindId[] = [...ROOM_REQUIRED_PLACE_KINDS];

export const MENU_SUPPORTED_PLACE_KINDS: PlaceKindId[] = [];

export const PACKAGE_SUPPORTED_PLACE_KINDS: PlaceKindId[] = [
  "transfer",
  "boat_tour",
  "paragliding_microlight_skydiving",
  "safari",
  "water_sports",
  "ski",
  "balloon_tour",
];

export const isPlaceKind = (value: string): value is PlaceKindId =>
  (PLACE_KIND_IDS as readonly string[]).includes(value);

export const isStayPlaceKind = (kind: string): boolean =>
  STAY_PLACE_KINDS.includes(kind as PlaceKindId);

export const requiresRoomSelectionForKind = (kind: string): boolean =>
  ROOM_REQUIRED_PLACE_KINDS.includes(kind as PlaceKindId);

export const supportsRoomsForKind = (kind: string): boolean =>
  ROOM_SUPPORTED_PLACE_KINDS.includes(kind as PlaceKindId);

export const supportsMenuForKind = (kind: string): boolean =>
  MENU_SUPPORTED_PLACE_KINDS.includes(kind as PlaceKindId);

export const supportsPackagesForKind = (kind: string): boolean =>
  PACKAGE_SUPPORTED_PLACE_KINDS.includes(kind as PlaceKindId);

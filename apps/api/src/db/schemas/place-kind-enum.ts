import { pgEnum } from "drizzle-orm/pg-core";

export const placeKindEnum = pgEnum("place_kind", [
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
]);

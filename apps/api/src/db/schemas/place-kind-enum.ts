import { pgEnum } from "drizzle-orm/pg-core";

export const placeKindEnum = pgEnum("place_kind", [
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
]);

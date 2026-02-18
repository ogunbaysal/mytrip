import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";
import { place } from "./places.ts";

// ============================================================================
// KIND-SPECIFIC PROFILES (1:1 WITH PLACE)
// ============================================================================

export const placeHotelProfile = pgTable(
  "place_hotel_profile",
  {
    placeId: text("place_id")
      .primaryKey()
      .references(() => place.id, { onDelete: "cascade" }),
    starRating: integer("star_rating"),
    minimumStayNights: integer("minimum_stay_nights"),
    childFriendly: boolean("child_friendly").notNull().default(true),
    allowsPets: boolean("allows_pets").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("place_hotel_profile_star_rating_idx").on(table.starRating)],
);

export const placeVillaProfile = pgTable("place_villa_profile", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  maxGuests: integer("max_guests"),
  bedroomCount: integer("bedroom_count"),
  bathroomCount: integer("bathroom_count"),
  poolAvailable: boolean("pool_available").notNull().default(false),
  nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }),
  cleaningFee: numeric("cleaning_fee", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const placeDiningProfile = pgTable("place_dining_profile", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  averagePricePerPerson: numeric("average_price_per_person", {
    precision: 10,
    scale: 2,
  }),
  reservationRequired: boolean("reservation_required").notNull().default(false),
  servesAlcohol: boolean("serves_alcohol").notNull().default(false),
  dressCode: text("dress_code"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const placeBeachProfile = pgTable("place_beach_profile", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  entranceFee: numeric("entrance_fee", { precision: 10, scale: 2 }),
  hasSunbedRental: boolean("has_sunbed_rental").notNull().default(false),
  hasShower: boolean("has_shower").notNull().default(false),
  hasLifeguard: boolean("has_lifeguard").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const placeNaturalProfile = pgTable("place_natural_profile", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  entryFee: numeric("entry_fee", { precision: 10, scale: 2 }),
  difficultyLevel: text("difficulty_level"),
  recommendedDurationMinutes: integer("recommended_duration_minutes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const placeActivityProfile = pgTable("place_activity_profile", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  startingPrice: numeric("starting_price", { precision: 10, scale: 2 }),
  averageDurationMinutes: integer("average_duration_minutes"),
  requiresReservation: boolean("requires_reservation").notNull().default(false),
  safetyRequirements: text("safety_requirements"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const placeVisitProfile = pgTable("place_visit_profile", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  recommendedDurationMinutes: integer("recommended_duration_minutes"),
  ticketPrice: numeric("ticket_price", { precision: 10, scale: 2 }),
  requiresGuide: boolean("requires_guide").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// SHARED PROFILE METADATA/TAGS (OPTIONAL)
// ============================================================================

export const placeTag = pgTable(
  "place_tag",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("place_tag_slug_idx").on(table.slug)],
);

export const placeTagAssignment = pgTable(
  "place_tag_assignment",
  {
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => placeTag.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.placeId, table.tagId], name: "place_tag_assignment_pk" }),
    index("place_tag_assignment_place_sort_idx").on(table.placeId, table.sortOrder),
  ],
);

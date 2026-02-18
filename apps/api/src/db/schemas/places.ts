import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  customType,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { placeKindEnum } from "./place-kind-enum.ts";
import { sql } from "drizzle-orm";
import { user } from "./auth.ts";
import { placeKind } from "./categories.ts";
import { district, province } from "./locations.ts";
import { file } from "./files.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const placeStatusEnum = pgEnum("place_status", [
  "active",
  "inactive",
  "pending",
  "suspended",
  "rejected",
]);

export const priceLevelEnum = pgEnum("price_level", [
  "budget",
  "moderate",
  "expensive",
  "luxury",
]);

export const placeMediaUsageEnum = pgEnum("place_media_usage", [
  "cover",
  "gallery",
  "menu",
  "room",
  "package",
  "other",
]);

const placeKindId = customType<{ data: string }>({
  dataType() {
    return "place_kind";
  },
});

// ============================================================================
// PLACES TABLE (CORE)
// ============================================================================

const placeTable = pgTable(
  "place",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    kind: placeKindEnum("kind").notNull().default("visit_location"),
    // Legacy category reference kept temporarily for incremental route migration.
    categoryId: placeKindId("category_id").references(() => placeKind.id, {
      onDelete: "set null",
    }),
    description: text("description"),
    shortDescription: text("short_description"),
    address: text("address"),
    cityId: text("city_id").references(() => province.id, {
      onDelete: "set null",
    }),
    districtId: text("district_id").references(() => district.id, {
      onDelete: "set null",
    }),
    location: text("location"),
    contactInfo: text("contact_info"),
    businessDocumentFileId: text("business_document_file_id").references(
      () => file.id,
      {
        onDelete: "set null",
      },
    ),
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
    reviewCount: integer("review_count").notNull().default(0),
    priceLevel: priceLevelEnum("price_level"),
    startingPrice: numeric("starting_price", { precision: 10, scale: 2 }),
    // Legacy field kept while routes are moved to kind profiles.
    nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }),
    status: placeStatusEnum("status").notNull().default("pending"),
    verified: boolean("verified").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    bookingCount: integer("booking_count").notNull().default(0),
    openingHours: text("opening_hours"),
    // Legacy fields kept while routes are moved to kind profiles.
    checkInInfo: text("check_in_info"),
    checkOutInfo: text("check_out_info"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("place_kind_idx").on(table.kind),
    index("place_category_id_idx").on(table.categoryId),
    index("place_city_id_idx").on(table.cityId),
    index("place_district_id_idx").on(table.districtId),
    index("place_business_document_file_id_idx").on(table.businessDocumentFileId),
    index("place_owner_id_idx").on(table.ownerId),
    index("place_status_idx").on(table.status),
    index("place_featured_idx").on(table.featured),
    index("place_verified_idx").on(table.verified),
    index("place_created_at_idx").on(table.createdAt),
  ],
);

export const place = Object.assign(placeTable, {
  // Legacy aliases still used in current route layer.
  type: placeTable.kind,
  category: placeTable.kind,
  city: placeTable.cityId,
  district: placeTable.districtId,
  images: sql<string>`NULL`,
  features: sql<string>`NULL`,
});

// ============================================================================
// PLACE MEDIA TABLE
// ============================================================================

export const placeMedia = pgTable(
  "place_media",
  {
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    usage: placeMediaUsageEnum("usage").notNull().default("gallery"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.placeId, table.fileId], name: "place_media_pk" }),
    index("place_media_place_usage_sort_idx").on(
      table.placeId,
      table.usage,
      table.sortOrder,
    ),
    uniqueIndex("place_media_place_sort_uniq").on(table.placeId, table.sortOrder),
    index("place_media_file_id_idx").on(table.fileId),
  ],
);

// ============================================================================
// FEATURES (SHARED TAG-LIKE FEATURES)
// ============================================================================

export const placeFeature = pgTable(
  "place_feature",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("place_feature_slug_idx").on(table.slug),
    index("place_feature_label_idx").on(table.label),
  ],
);

export const placeFeatureAssignment = pgTable(
  "place_feature_assignment",
  {
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    amenityId: text("amenity_id")
      .notNull()
      .references(() => placeFeature.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.placeId, table.amenityId],
      name: "place_feature_assignment_pk",
    }),
    uniqueIndex("place_feature_assignment_place_sort_uniq").on(
      table.placeId,
      table.sortOrder,
    ),
    index("place_feature_assignment_place_sort_idx").on(table.placeId, table.sortOrder),
    index("place_feature_assignment_amenity_id_idx").on(table.amenityId),
  ],
);

export const placeFeatureAssignmentAlias = Object.assign(placeFeatureAssignment, {
  featureId: placeFeatureAssignment.amenityId,
});

// ============================================================================
// LEGACY ALIASES (FOR INCREMENTAL APP LAYER MIGRATION)
// ============================================================================

export const placeImage = placeMedia;
export const amenity = placeFeature;
export const placeAmenity = placeFeatureAssignmentAlias;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Place = typeof place.$inferSelect;
export type NewPlace = typeof place.$inferInsert;

export type PlaceMedia = typeof placeMedia.$inferSelect;
export type NewPlaceMedia = typeof placeMedia.$inferInsert;

export type PlaceFeature = typeof placeFeature.$inferSelect;
export type NewPlaceFeature = typeof placeFeature.$inferInsert;

export type PlaceFeatureAssignment = typeof placeFeatureAssignment.$inferSelect;
export type NewPlaceFeatureAssignment = typeof placeFeatureAssignment.$inferInsert;

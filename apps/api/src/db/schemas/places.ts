import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { placeCategory } from "./categories.ts";
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

// ============================================================================
// PLACES TABLE
// ============================================================================

const placeTable = pgTable(
  "place",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    categoryId: text("category_id").references(() => placeCategory.id, {
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
    location: text("location"), // JSON string for GPS coordinates {lat, lng}
    contactInfo: text("contact_info"), // JSON string for phone, email, website
    rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
    reviewCount: integer("review_count").notNull().default(0),
    priceLevel: priceLevelEnum("price_level"),
    nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }),
    status: placeStatusEnum("status").notNull().default("pending"),
    verified: boolean("verified").notNull().default(false),
    featured: boolean("featured").notNull().default(false),
    ownerId: text("owner_id").references(() => user.id, { onDelete: "cascade" }),
    views: integer("views").notNull().default(0),
    bookingCount: integer("booking_count").notNull().default(0),
    openingHours: text("opening_hours"), // JSON object for weekly schedule
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
    index("place_category_id_idx").on(table.categoryId),
    index("place_city_id_idx").on(table.cityId),
    index("place_district_id_idx").on(table.districtId),
    index("place_owner_id_idx").on(table.ownerId),
    index("place_status_idx").on(table.status),
    index("place_featured_idx").on(table.featured),
    index("place_verified_idx").on(table.verified),
    index("place_created_at_idx").on(table.createdAt),
  ],
);

export const place = Object.assign(placeTable, {
  // Backward-compatible column aliases for route refactors.
  type: placeTable.categoryId,
  category: placeTable.categoryId,
  city: placeTable.cityId,
  district: placeTable.districtId,
  images: sql<string>`NULL`,
  features: sql<string>`NULL`,
});

// ============================================================================
// PLACE IMAGES TABLE
// ============================================================================

export const placeImage = pgTable(
  "place_image",
  {
    placeId: text("place_id")
      .notNull()
      .references(() => placeTable.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.placeId, table.fileId], name: "place_image_pk" }),
    uniqueIndex("place_image_place_sort_order_uniq").on(
      table.placeId,
      table.sortOrder,
    ),
    index("place_image_place_sort_idx").on(table.placeId, table.sortOrder),
    index("place_image_file_id_idx").on(table.fileId),
  ],
);

// ============================================================================
// AMENITIES TABLE
// ============================================================================

export const amenity = pgTable(
  "amenity",
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
    index("amenity_slug_idx").on(table.slug),
    index("amenity_label_idx").on(table.label),
  ],
);

// ============================================================================
// PLACE AMENITIES TABLE
// ============================================================================

export const placeAmenity = pgTable(
  "place_amenity",
  {
    placeId: text("place_id")
      .notNull()
      .references(() => placeTable.id, { onDelete: "cascade" }),
    amenityId: text("amenity_id")
      .notNull()
      .references(() => amenity.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.placeId, table.amenityId],
      name: "place_amenity_pk",
    }),
    uniqueIndex("place_amenity_place_sort_order_uniq").on(
      table.placeId,
      table.sortOrder,
    ),
    index("place_amenity_place_sort_idx").on(table.placeId, table.sortOrder),
    index("place_amenity_amenity_id_idx").on(table.amenityId),
  ],
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Place = typeof place.$inferSelect;
export type NewPlace = typeof place.$inferInsert;
export type PlaceImage = typeof placeImage.$inferSelect;
export type NewPlaceImage = typeof placeImage.$inferInsert;
export type Amenity = typeof amenity.$inferSelect;
export type NewAmenity = typeof amenity.$inferInsert;
export type PlaceAmenity = typeof placeAmenity.$inferSelect;
export type NewPlaceAmenity = typeof placeAmenity.$inferInsert;

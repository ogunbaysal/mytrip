import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// ============================================================================
// ENUMS
// ============================================================================

export const placeTypeEnum = pgEnum("place_type", [
  "hotel",
  "restaurant",
  "cafe",
  "activity",
  "attraction",
  "transport"
]);

export const placeStatusEnum = pgEnum("place_status", [
  "active",
  "inactive",
  "pending",
  "suspended"
]);

export const priceLevelEnum = pgEnum("price_level", [
  "budget",
  "moderate",
  "expensive",
  "luxury"
]);

// ============================================================================
// PLACES TABLE
// ============================================================================

export const place = pgTable("place", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  type: placeTypeEnum("type").notNull(),
  category: text("category").notNull(), // e.g., "Lüks Oteller", "Deniz Kafeleri"
  description: text("description"),
  shortDescription: text("short_description"),
  address: text("address"),
  city: text("city"),
  district: text("district"),
  location: text("location"), // JSON string for GPS coordinates {lat, lng}
  contactInfo: text("contact_info"), // JSON string for phone, email, website
  rating: numeric("rating", { precision: 3, scale: 2 }).default("0.00"),
  reviewCount: integer("review_count").notNull().default(0),
  priceLevel: priceLevelEnum("price_level"),
  nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }),
  features: text("features"), // JSON array of amenities/features
  images: text("images"), // JSON array of image URLs
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
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Place = typeof place.$inferSelect;
export type NewPlace = typeof place.$inferInsert;
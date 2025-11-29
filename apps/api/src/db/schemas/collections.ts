import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  jsonb
} from "drizzle-orm/pg-core";

// ============================================================================
// ENUMS
// ============================================================================

export const collectionStatusEnum = pgEnum("collection_status", [
  "published",
  "draft",
  "archived"
]);

// ============================================================================
// COLLECTIONS TABLE
// ============================================================================

export const collection = pgTable("collection", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  heroImage: text("hero_image"),
  intro: text("intro"),
  duration: text("duration"), // e.g., "3 days"
  season: text("season"), // Best season to visit
  bestFor: text("best_for"), // JSON array of target audiences
  highlights: text("highlights"), // JSON array of collection highlights
  itinerary: text("itinerary"), // JSON object for day-by-day itinerary
  tips: text("tips"), // JSON array of travel tips
  featuredPlaces: text("featured_places"), // JSON array of place IDs
  itemCount: integer("item_count").notNull().default(0),
  status: collectionStatusEnum("status").notNull().default("draft"),
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

export type Collection = typeof collection.$inferSelect;
export type NewCollection = typeof collection.$inferInsert;
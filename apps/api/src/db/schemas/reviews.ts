import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { place } from "./places.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const reviewStatusEnum = pgEnum("review_status", [
  "published",
  "hidden",
  "flagged"
]);

// ============================================================================
// REVIEWS TABLE
// ============================================================================

export const review = pgTable("review", {
  id: text("id").primaryKey(),
  placeId: text("place_id")
    .notNull()
    .references(() => place.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"),
  content: text("content"),
  images: text("images"), // JSON array of review photos
  helpfulCount: integer("helpful_count").notNull().default(0), // Helpful votes
  verifiedStay: boolean("verified_stay").notNull().default(false), // User actually visited
  response: text("response"), // Owner response
  responseDate: timestamp("response_date", { withTimezone: true }),
  status: reviewStatusEnum("status").notNull().default("published"),
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

export type Review = typeof review.$inferSelect;
export type NewReview = typeof review.$inferInsert;
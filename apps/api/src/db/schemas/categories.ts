
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// ============================================================================
// PLACE CATEGORIES TABLE
// ============================================================================

export const placeCategory = pgTable("place_category", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"), // Material icon name or URL
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PlaceCategory = typeof placeCategory.$inferSelect;
export type NewPlaceCategory = typeof placeCategory.$inferInsert;

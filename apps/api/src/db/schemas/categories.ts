import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  customType,
} from "drizzle-orm/pg-core";

const placeKindId = customType<{ data: string }>({
  dataType() {
    return "place_kind";
  },
});

// ============================================================================
// PLACE KIND METADATA TABLE
// ============================================================================

export const placeKind = pgTable("place_kind_meta", {
  id: placeKindId("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  icon: text("icon"),
  description: text("description"),
  monetized: boolean("monetized").notNull().default(true),
  supportsRooms: boolean("supports_rooms").notNull().default(false),
  supportsMenu: boolean("supports_menu").notNull().default(false),
  supportsPackages: boolean("supports_packages").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type PlaceKind = typeof placeKind.$inferSelect;
export type NewPlaceKind = typeof placeKind.$inferInsert;

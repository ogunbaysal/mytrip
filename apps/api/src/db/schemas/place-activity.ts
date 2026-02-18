import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  timestamp,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { file } from "./files.ts";
import { place } from "./places.ts";

export const activityPackage = pgTable(
  "activity_package",
  {
    id: text("id").primaryKey(),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }),
    durationMinutes: integer("duration_minutes"),
    minParticipants: integer("min_participants"),
    maxParticipants: integer("max_participants"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("activity_package_place_name_uniq").on(table.placeId, table.name),
    index("activity_package_place_sort_idx").on(table.placeId, table.sortOrder),
    index("activity_package_place_active_idx").on(table.placeId, table.isActive),
  ],
);

export const activityPackageMedia = pgTable(
  "activity_package_media",
  {
    packageId: text("package_id")
      .notNull()
      .references(() => activityPackage.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      columns: [table.packageId, table.fileId],
      name: "activity_package_media_pk",
    }),
    uniqueIndex("activity_package_media_package_sort_uniq").on(
      table.packageId,
      table.sortOrder,
    ),
  ],
);

export const activityPackagePriceTier = pgTable(
  "activity_package_price_tier",
  {
    id: text("id").primaryKey(),
    packageId: text("package_id")
      .notNull()
      .references(() => activityPackage.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    minGroupSize: integer("min_group_size"),
    maxGroupSize: integer("max_group_size"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("activity_package_price_tier_package_sort_idx").on(table.packageId, table.sortOrder)],
);

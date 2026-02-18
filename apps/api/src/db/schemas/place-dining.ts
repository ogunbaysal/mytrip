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

export const diningMenu = pgTable(
  "dining_menu",
  {
    id: text("id").primaryKey(),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
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
    uniqueIndex("dining_menu_place_name_uniq").on(table.placeId, table.name),
    index("dining_menu_place_sort_idx").on(table.placeId, table.sortOrder),
  ],
);

export const diningMenuSection = pgTable(
  "dining_menu_section",
  {
    id: text("id").primaryKey(),
    menuId: text("menu_id")
      .notNull()
      .references(() => diningMenu.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("dining_menu_section_menu_sort_idx").on(table.menuId, table.sortOrder)],
);

export const diningMenuItem = pgTable(
  "dining_menu_item",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => diningMenuSection.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }),
    imageFileId: text("image_file_id").references(() => file.id, {
      onDelete: "set null",
    }),
    isAvailable: boolean("is_available").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("dining_menu_item_section_sort_idx").on(table.sectionId, table.sortOrder),
    index("dining_menu_item_available_idx").on(table.isAvailable),
  ],
);

export const diningMenuItemTag = pgTable(
  "dining_menu_item_tag",
  {
    itemId: text("item_id")
      .notNull()
      .references(() => diningMenuItem.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.itemId, table.tag], name: "dining_menu_item_tag_pk" })],
);

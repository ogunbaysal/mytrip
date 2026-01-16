import {
  pgTable,
  text,
  timestamp,
  integer,
  numeric,
  index,
} from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

// ============================================================================
// PROVINCES (İller)
// ============================================================================

export const province = pgTable(
  "province",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    code: text("code").notNull().unique(), // Plate code: "01", "02", ... "81"
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("province_code_idx").on(table.code),
    index("province_name_idx").on(table.name),
  ],
);

// ============================================================================
// DISTRICTS (İlçeler)
// ============================================================================

export const district = pgTable(
  "district",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => nanoid()),
    provinceId: text("province_id")
      .notNull()
      .references(() => province.id, { onDelete: "cascade" }),
    provinceCode: text("province_code").notNull(), // Denormalized for quick lookups
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    postalCode: text("postal_code"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("district_province_id_idx").on(table.provinceId),
    index("district_province_code_idx").on(table.provinceCode),
    index("district_name_idx").on(table.name),
  ],
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Province = typeof province.$inferSelect;
export type NewProvince = typeof province.$inferInsert;
export type District = typeof district.$inferSelect;
export type NewDistrict = typeof district.$inferInsert;

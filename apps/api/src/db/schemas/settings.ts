import { pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

export const settings = pgTable("settings", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => nanoid()),
  key: text("key").notNull().unique(), // e.g., 'general', 'notifications', 'billing'
  value: jsonb("value").notNull().default({}), // Stores the configuration object
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;

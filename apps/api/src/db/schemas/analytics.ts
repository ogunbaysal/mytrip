import {
  pgTable,
  text,
  timestamp,
  jsonb
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { place } from "./places.ts";

// ============================================================================
// ANALYTICS EVENTS TABLE
// ============================================================================

export const analyticsEvent = pgTable("analytics_event", {
  id: text("id").primaryKey(),
  eventType: text("event_type").notNull(), // "view", "booking", "search", etc.
  userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
  placeId: text("place_id").references(() => place.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  metadata: text("metadata"), // JSON object for event-specific data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type AnalyticsEvent = typeof analyticsEvent.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvent.$inferInsert;
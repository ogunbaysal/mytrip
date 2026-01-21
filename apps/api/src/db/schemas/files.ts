import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const fileTypeEnum = pgEnum("file_type", [
  "image",
  "document",
  "video",
  "audio",
  "other",
]);

export const fileUsageEnum = pgEnum("file_usage", [
  "blog_hero",
  "blog_featured",
  "blog_content",
  "place_image",
  "place_gallery",
  "profile_avatar",
  "profile_cover",
  "other",
]);

// ============================================================================
// FILES TABLE
// ============================================================================

export const file = pgTable("file", {
  id: text("id").primaryKey(),
  filename: text("filename").notNull(), // Original filename
  storedFilename: text("stored_filename").notNull(), // UUID-based filename on disk
  url: text("url").notNull(), // Full URL to access the file
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  type: fileTypeEnum("type").notNull().default("image"),
  usage: fileUsageEnum("usage").notNull().default("other"),
  uploadedById: text("uploaded_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type File = typeof file.$inferSelect;
export type NewFile = typeof file.$inferInsert;

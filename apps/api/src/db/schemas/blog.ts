import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const blogCategoryEnum = pgEnum("blog_category", [
  "travel",
  "food",
  "culture",
  "history",
  "activity",
  "lifestyle",
  "business"
]);

export const blogStatusEnum = pgEnum("blog_status", [
  "published",
  "draft",
  "archived",
  "pending_review"
]);

export const languageEnum = pgEnum("language", ["tr", "en"]);

export const readingLevelEnum = pgEnum("reading_level", [
  "easy",
  "medium",
  "hard"
]);

export const targetAudienceEnum = pgEnum("target_audience", [
  "travelers",
  "locals",
  "business_owners",
  "all"
]);

// ============================================================================
// BLOG POSTS TABLE
// ============================================================================

export const blogPost = pgTable("blog_post", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  content: text("content"), // Full article content
  heroImage: text("hero_image"),
  featuredImage: text("featured_image"),
  images: text("images"), // JSON array of additional images
  category: blogCategoryEnum("category").notNull(),
  tags: text("tags"), // JSON array of tags
  status: blogStatusEnum("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  authorId: text("author_id").references(() => user.id, { onDelete: "cascade" }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  views: integer("views").notNull().default(0),
  readTime: integer("read_time"), // Estimated reading time in minutes
  likeCount: integer("like_count").notNull().default(0),
  commentCount: integer("comment_count").notNull().default(0),
  shareCount: integer("share_count").notNull().default(0),
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"), // JSON array of keywords
  language: languageEnum("language").notNull().default("tr"),
  readingLevel: readingLevelEnum("reading_level").notNull().default("medium"),
  targetAudience: targetAudienceEnum("target_audience").notNull().default("travelers"),
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

export type BlogPost = typeof blogPost.$inferSelect;
export type NewBlogPost = typeof blogPost.$inferInsert;
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { file } from "./files.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const blogStatusEnum = pgEnum("blog_status", [
  "published",
  "draft",
  "archived",
  "pending_review",
]);

export const languageEnum = pgEnum("language", ["tr", "en"]);

export const blogCommentStatusEnum = pgEnum("blog_comment_status", [
  "pending",
  "published",
  "rejected",
  "spam",
]);

// ============================================================================
// BLOG CATEGORY TABLE
// ============================================================================

export const blogCategory = pgTable(
  "blog_category",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_category_slug_idx").on(table.slug),
    index("blog_category_active_idx").on(table.active),
    index("blog_category_sort_order_idx").on(table.sortOrder),
  ],
);

// ============================================================================
// BLOG TABLE
// ============================================================================

const blogTable = pgTable(
  "blog",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    content: text("content"),
    heroImageId: text("hero_image_id").references(() => file.id, {
      onDelete: "set null",
    }),
    featuredImageId: text("featured_image_id").references(() => file.id, {
      onDelete: "set null",
    }),
    categoryId: text("category_id").references(() => blogCategory.id, {
      onDelete: "set null",
    }),
    tags: text("tags"), // JSON array
    status: blogStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    views: integer("views").notNull().default(0),
    readTime: integer("read_time"),
    likeCount: integer("like_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    seoKeywords: text("seo_keywords"), // JSON array
    language: languageEnum("language").notNull().default("tr"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_category_id_idx").on(table.categoryId),
    index("blog_author_id_idx").on(table.authorId),
    index("blog_status_idx").on(table.status),
    index("blog_featured_idx").on(table.featured),
    index("blog_published_at_idx").on(table.publishedAt),
    index("blog_created_at_idx").on(table.createdAt),
    index("blog_hero_image_id_idx").on(table.heroImageId),
    index("blog_featured_image_id_idx").on(table.featuredImageId),
  ],
);

export const blog = Object.assign(blogTable, {
  // Backward-compatible aliases for incremental route/form refactors.
  category: blogTable.categoryId,
  heroImage: blogTable.heroImageId,
  featuredImage: blogTable.featuredImageId,
  images: sql<string>`NULL`,
  commentCount: sql<number>`0`,
  readingLevel: sql<string>`NULL`,
  targetAudience: sql<string>`NULL`,
});

// Keep `blogPost` export temporarily to avoid wide immediate import churn.
export const blogPost = blog;

// ============================================================================
// BLOG IMAGE TABLE
// ============================================================================

export const blogImage = pgTable(
  "blog_image",
  {
    blogId: text("blog_id")
      .notNull()
      .references(() => blogTable.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.blogId, table.fileId], name: "blog_image_pk" }),
    uniqueIndex("blog_image_blog_sort_order_uniq").on(
      table.blogId,
      table.sortOrder,
    ),
    index("blog_image_blog_sort_idx").on(table.blogId, table.sortOrder),
    index("blog_image_file_id_idx").on(table.fileId),
  ],
);

// ============================================================================
// BLOG COMMENT TABLE
// ============================================================================

export const blogComment = pgTable(
  "blog_comment",
  {
    id: text("id").primaryKey(),
    blogId: text("blog_id")
      .notNull()
      .references(() => blogTable.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    guestName: text("guest_name"),
    guestEmail: text("guest_email"),
    content: text("content").notNull(),
    status: blogCommentStatusEnum("status").notNull().default("pending"),
    adminNote: text("admin_note"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("blog_comment_blog_id_idx").on(table.blogId),
    index("blog_comment_status_idx").on(table.status),
    index("blog_comment_created_at_idx").on(table.createdAt),
    index("blog_comment_user_id_idx").on(table.userId),
  ],
);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BlogCategory = typeof blogCategory.$inferSelect;
export type NewBlogCategory = typeof blogCategory.$inferInsert;

export type Blog = typeof blog.$inferSelect;
export type NewBlog = typeof blog.$inferInsert;

export type BlogPost = typeof blogPost.$inferSelect;
export type NewBlogPost = typeof blogPost.$inferInsert;

export type BlogImage = typeof blogImage.$inferSelect;
export type NewBlogImage = typeof blogImage.$inferInsert;

export type BlogComment = typeof blogComment.$inferSelect;
export type NewBlogComment = typeof blogComment.$inferInsert;

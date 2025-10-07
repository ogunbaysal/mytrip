import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const blogStatusEnum = pgEnum('blog_status', ['draft', 'pending', 'approved', 'published', 'rejected']);
export const blogTypeEnum = pgEnum('blog_type', ['editorial', 'owner', 'collection']);

export const blogs = pgTable('blogs', {
  id: uuid('id').defaultRandom().primaryKey(),
  authorId: uuid('author_id').references(() => users.id).notNull(),
  type: blogTypeEnum('type').notNull().default('editorial'),
  status: blogStatusEnum('status').notNull().default('draft'),
  
  // Content (bilingual support)
  title: varchar('title', { length: 255 }).notNull(),
  titleEn: varchar('title_en', { length: 255 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  slugEn: varchar('slug_en', { length: 255 }).unique(),
  
  // Content body
  content: text('content').notNull(),
  contentEn: text('content_en'),
  excerpt: text('excerpt'),
  excerptEn: text('excerpt_en'),
  
  // SEO metadata
  metaTitle: varchar('meta_title', { length: 255 }),
  metaTitleEn: varchar('meta_title_en', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  metaDescriptionEn: varchar('meta_description_en', { length: 500 }),
  
  // Media
  featuredImage: varchar('featured_image', { length: 500 }),
  images: jsonb('images'), // Array of image objects used in content
  
  // Categorization and tagging
  categories: jsonb('categories'), // Array of category objects
  tags: jsonb('tags'), // Array of tags for filtering and search
  
  // Engagement metrics
  viewCount: text('view_count').default('0'), // Using text to handle large numbers
  readTime: text('read_time'), // Estimated read time in minutes
  
  // Featured and promotion
  isFeatured: boolean('is_featured').notNull().default(false),
  featuredOrder: text('featured_order').default('0'),
  
  // Related content
  relatedPlaces: jsonb('related_places'), // Array of place IDs
  relatedBlogs: jsonb('related_blogs'), // Array of blog IDs
  
  // Publishing and scheduling
  publishedAt: timestamp('published_at', { withTimezone: true }),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  
  // Admin moderation
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  moderatedBy: uuid('moderated_by').references(() => users.id),
  moderatedAt: timestamp('moderated_at', { withTimezone: true }),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    authorIdIdx: index('blogs_author_id_idx').on(table.authorId),
    statusIdx: index('blogs_status_idx').on(table.status),
    typeIdx: index('blogs_type_idx').on(table.type),
    slugIdx: index('blogs_slug_idx').on(table.slug),
    slugEnIdx: index('blogs_slug_en_idx').on(table.slugEn),
    featuredIdx: index('blogs_featured_idx').on(table.isFeatured, table.featuredOrder),
    publishedIdx: index('blogs_published_idx').on(table.publishedAt),
  };
});

export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

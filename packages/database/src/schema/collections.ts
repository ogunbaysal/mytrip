import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const collections = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  
  // Collection information (bilingual)
  name: varchar('name', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  slugEn: varchar('slug_en', { length: 255 }).unique(),
  
  // Descriptions
  description: text('description'),
  descriptionEn: text('description_en'),
  shortDescription: varchar('short_description', { length: 500 }),
  shortDescriptionEn: varchar('short_description_en', { length: 500 }),
  
  // SEO metadata
  metaTitle: varchar('meta_title', { length: 255 }),
  metaTitleEn: varchar('meta_title_en', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  metaDescriptionEn: varchar('meta_description_en', { length: 500 }),
  
  // Media
  featuredImage: varchar('featured_image', { length: 500 }),
  images: jsonb('images'), // Array of image objects
  
  // Collection settings
  isPublic: boolean('is_public').notNull().default(true),
  isFeatured: boolean('is_featured').notNull().default(false),
  featuredOrder: text('featured_order').default('0'),
  
  // Content references
  placeIds: jsonb('place_ids'), // Array of place UUIDs
  blogIds: jsonb('blog_ids'), // Array of blog UUIDs
  
  // Tags and categorization
  tags: jsonb('tags'), // Array of tags
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    createdByIdx: index('collections_created_by_idx').on(table.createdBy),
    slugIdx: index('collections_slug_idx').on(table.slug),
    slugEnIdx: index('collections_slug_en_idx').on(table.slugEn),
    featuredIdx: index('collections_featured_idx').on(table.isFeatured, table.featuredOrder),
    publicIdx: index('collections_public_idx').on(table.isPublic),
  };
});

export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;

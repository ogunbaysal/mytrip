import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, jsonb, decimal, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const placeTypeEnum = pgEnum('place_type', ['hotel', 'restaurant', 'villa', 'flat', 'activity']);
export const placeStatusEnum = pgEnum('place_status', ['draft', 'pending', 'approved', 'rejected', 'suspended']);

export const places = pgTable('places', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  type: placeTypeEnum('type').notNull(),
  status: placeStatusEnum('status').notNull().default('draft'),
  
  // Core information (required)
  name: varchar('name', { length: 255 }).notNull(),
  nameEn: varchar('name_en', { length: 255 }),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  slugEn: varchar('slug_en', { length: 255 }).unique(),
  
  // Descriptions
  description: text('description').notNull(),
  descriptionEn: text('description_en'),
  shortDescription: varchar('short_description', { length: 500 }),
  shortDescriptionEn: varchar('short_description_en', { length: 500 }),
  
  // Location information
  address: text('address').notNull(),
  addressEn: text('address_en'),
  city: varchar('city', { length: 100 }).notNull(),
  district: varchar('district', { length: 100 }),
  postalCode: varchar('postal_code', { length: 10 }),
  latitude: decimal('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: decimal('longitude', { precision: 10, scale: 7 }).notNull(),
  
  // Contact information
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  
  // Type-specific data stored as JSONB
  typeSpecificData: jsonb('type_specific_data'),
  
  // SEO and metadata
  metaTitle: varchar('meta_title', { length: 255 }),
  metaTitleEn: varchar('meta_title_en', { length: 255 }),
  metaDescription: varchar('meta_description', { length: 500 }),
  metaDescriptionEn: varchar('meta_description_en', { length: 500 }),
  
  // Media
  featuredImage: varchar('featured_image', { length: 500 }),
  images: jsonb('images'), // Array of image objects
  
  // Pricing (for display purposes)
  priceRange: varchar('price_range', { length: 50 }), // e.g., "$$", "$$$"
  averagePrice: decimal('average_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('TRY'),
  
  // Amenities and features
  amenities: jsonb('amenities'), // Array of amenity IDs or objects
  tags: jsonb('tags'), // Array of tags for filtering
  
  // Admin notes and moderation
  adminNotes: text('admin_notes'),
  rejectionReason: text('rejection_reason'),
  
  // Activity tracking
  viewCount: decimal('view_count', { precision: 10, scale: 0 }).default('0'),
  lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
  
  // Timestamps
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  publishedAt: timestamp('published_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    ownerIdIdx: index('places_owner_id_idx').on(table.ownerId),
    typeIdx: index('places_type_idx').on(table.type),
    statusIdx: index('places_status_idx').on(table.status),
    locationIdx: index('places_location_idx').on(table.latitude, table.longitude),
    slugIdx: index('places_slug_idx').on(table.slug),
    slugEnIdx: index('places_slug_en_idx').on(table.slugEn),
  };
});

export type Place = typeof places.$inferSelect;
export type NewPlace = typeof places.$inferInsert;

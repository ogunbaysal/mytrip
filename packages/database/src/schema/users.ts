import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";

export const userTypeEnum = pgEnum('user_type', ['traveler', 'owner', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'suspended', 'pending']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  userType: userTypeEnum('user_type').notNull().default('traveler'),
  status: userStatusEnum('status').notNull().default('active'),
  languagePreference: varchar('language_preference', { length: 5 }).notNull().default('tr'),
  emailVerified: boolean('email_verified').notNull().default(false),
  emailVerifiedAt: timestamp('email_verified_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

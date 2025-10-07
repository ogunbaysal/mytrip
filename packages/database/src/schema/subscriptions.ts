import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'cancelled', 'past_due', 'paused']);
export const planTypeEnum = pgEnum('plan_type', ['basic', 'premium', 'enterprise']);
export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'yearly']);

export const subscriptionPlans = pgTable('subscription_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  nameEn: varchar('name_en', { length: 100 }),
  description: text('description'),
  descriptionEn: text('description_en'),
  planType: planTypeEnum('plan_type').notNull(),
  
  // Pricing
  monthlyPrice: decimal('monthly_price', { precision: 10, scale: 2 }).notNull(),
  yearlyPrice: decimal('yearly_price', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
  
  // Features and limits
  features: jsonb('features'), // Array of feature objects
  maxListings: text('max_listings').default('1'), // -1 for unlimited
  maxImages: text('max_images').default('10'),
  maxBlogPosts: text('max_blog_posts').default('5'),
  
  // Status and availability
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: text('sort_order').default('0'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  planId: uuid('plan_id').references(() => subscriptionPlans.id).notNull(),
  
  // Subscription details
  status: subscriptionStatusEnum('status').notNull().default('active'),
  billingCycle: billingCycleEnum('billing_cycle').notNull().default('monthly'),
  
  // Payment and billing
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
  paymentMethod: varchar('payment_method', { length: 50 }), // card, bank_transfer, etc.
  
  // External payment gateway data
  externalSubscriptionId: varchar('external_subscription_id', { length: 255 }),
  paymentGateway: varchar('payment_gateway', { length: 50 }), // stripe, iyzico, etc.
  gatewayData: jsonb('gateway_data'), // Store gateway-specific data
  
  // Subscription period
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  
  // Trial period
  trialStart: timestamp('trial_start', { withTimezone: true }),
  trialEnd: timestamp('trial_end', { withTimezone: true }),
  
  // Cancellation
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  cancelReason: text('cancel_reason'),
  
  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
    planIdIdx: index('subscriptions_plan_id_idx').on(table.planId),
    statusIdx: index('subscriptions_status_idx').on(table.status),
    externalIdIdx: index('subscriptions_external_id_idx').on(table.externalSubscriptionId),
    periodIdx: index('subscriptions_period_idx').on(table.currentPeriodStart, table.currentPeriodEnd),
  };
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

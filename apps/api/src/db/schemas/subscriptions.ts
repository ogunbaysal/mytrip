import {
  pgTable,
  text,
  numeric,
  boolean,
  integer,
  date,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "quarterly",
  "yearly",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
  "pending",
  "trial",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "success",
  "failed",
  "pending",
  "refunded",
]);

export const currencyEnum = pgEnum("currency", ["TRY", "USD", "EUR"]);

export const providerEnum = pgEnum("provider", [
  "iyzico",
  "paytr",
  "stripe",
  "mock",
]);

export const couponDiscountTypeEnum = pgEnum("coupon_discount_type", [
  "percent",
  "fixed",
]);

export const couponScopeEnum = pgEnum("coupon_scope", [
  "all_plans",
  "specific_plans",
]);

export const subscriptionPlan = pgTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  maxPlaces: integer("max_places").notNull().default(1),
  maxBlogs: integer("max_blogs").notNull().default(1),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  billingCycleIdx: index("subscription_plan_billing_cycle_idx").on(
    table.billingCycle,
  ),
  sortOrderIdx: index("subscription_plan_sort_order_idx").on(table.sortOrder),
}));

export const subscriptionPlanFeature = pgTable("subscription_plan_feature", {
  id: text("id").primaryKey(),
  planId: text("plan_id")
    .notNull()
    .references(() => subscriptionPlan.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  planSortIdx: index("subscription_plan_feature_plan_sort_idx").on(
    table.planId,
    table.sortOrder,
  ),
  planLabelUnique: uniqueIndex("subscription_plan_feature_plan_label_uniq").on(
    table.planId,
    table.label,
  ),
}));

export const coupon = pgTable("coupon", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  description: text("description"),
  discountType: couponDiscountTypeEnum("discount_type").notNull(),
  discountValue: numeric("discount_value", { precision: 10, scale: 2 })
    .notNull(),
  scope: couponScopeEnum("scope").notNull().default("all_plans"),
  maxRedemptions: integer("max_redemptions"),
  maxRedemptionsPerUser: integer("max_redemptions_per_user")
    .notNull()
    .default(1),
  active: boolean("active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  codeUnique: uniqueIndex("coupon_code_uniq").on(table.code),
  activeIdx: index("coupon_active_idx").on(table.active),
  startsAtIdx: index("coupon_starts_at_idx").on(table.startsAt),
  endsAtIdx: index("coupon_ends_at_idx").on(table.endsAt),
  percentRangeCheck: check(
    "coupon_percent_range_check",
    sql`${table.discountType} <> 'percent' OR (${table.discountValue} >= 0 AND ${table.discountValue} <= 100)`,
  ),
  fixedPositiveCheck: check(
    "coupon_fixed_positive_check",
    sql`${table.discountType} <> 'fixed' OR ${table.discountValue} > 0`,
  ),
}));

export const couponPlan = pgTable("coupon_plan", {
  id: text("id").primaryKey(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupon.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => subscriptionPlan.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  couponPlanUnique: uniqueIndex("coupon_plan_coupon_id_plan_id_uniq").on(
    table.couponId,
    table.planId,
  ),
  couponPlanCouponIdx: index("coupon_plan_coupon_id_idx").on(table.couponId),
  couponPlanPlanIdx: index("coupon_plan_plan_id_idx").on(table.planId),
}));

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => subscriptionPlan.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull().default("pending"),
  provider: providerEnum("provider").notNull().default("iyzico"),
  providerSubscriptionId: text("provider_subscription_id"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  couponId: text("coupon_id").references(() => coupon.id, {
    onDelete: "set null",
  }),
  couponCode: text("coupon_code"),
  currency: currencyEnum("currency").notNull().default("TRY"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  nextBillingDate: date("next_billing_date"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  usage: text("usage"),
  paymentMethod: text("payment_method"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  userStatusIdx: index("subscription_user_status_idx").on(
    table.userId,
    table.status,
  ),
  planIdx: index("subscription_plan_id_idx").on(table.planId),
  couponIdx: index("subscription_coupon_id_idx").on(table.couponId),
  nextBillingIdx: index("subscription_next_billing_date_idx").on(
    table.nextBillingDate,
  ),
}));

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => subscription.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  provider: providerEnum("provider").notNull().default("iyzico"),
  providerTransactionId: text("provider_transaction_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  gatewayResponse: text("gateway_response"),
  invoiceId: text("invoice_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  subscriptionIdx: index("payment_subscription_id_idx").on(table.subscriptionId),
  userIdx: index("payment_user_id_idx").on(table.userId),
  statusIdx: index("payment_status_idx").on(table.status),
}));

export const couponRedemption = pgTable("coupon_redemption", {
  id: text("id").primaryKey(),
  couponId: text("coupon_id")
    .notNull()
    .references(() => coupon.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").references(() => subscription.id, {
    onDelete: "set null",
  }),
  planId: text("plan_id").references(() => subscriptionPlan.id, {
    onDelete: "set null",
  }),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 })
    .notNull(),
  finalAmount: numeric("final_amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  redeemedAt: timestamp("redeemed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  couponIdx: index("coupon_redemption_coupon_id_idx").on(table.couponId),
  userIdx: index("coupon_redemption_user_id_idx").on(table.userId),
  subscriptionIdx: index("coupon_redemption_subscription_id_idx").on(
    table.subscriptionId,
  ),
  couponUserIdx: index("coupon_redemption_coupon_user_idx").on(
    table.couponId,
    table.userId,
  ),
}));

export const businessRegistrationStatusEnum = pgEnum(
  "business_registration_status",
  ["pending", "approved", "rejected"],
);

export const businessRegistration = pgTable("business_registration", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  companyName: text("company_name").notNull(),
  taxId: text("tax_id").notNull(),
  businessAddress: text("business_address"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  businessType: text("business_type"),
  documents: text("documents"),
  status: businessRegistrationStatusEnum("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const businessProfile = pgTable("business_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  logo: text("logo"),
  description: text("description"),
  website: text("website"),
  socialMedia: text("social_media"),
  businessHours: text("business_hours"),
  responseTime: text("response_time"),
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

export type SubscriptionPlan = typeof subscriptionPlan.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlan.$inferInsert;
export type SubscriptionPlanFeature = typeof subscriptionPlanFeature.$inferSelect;
export type NewSubscriptionPlanFeature = typeof subscriptionPlanFeature.$inferInsert;

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export type Coupon = typeof coupon.$inferSelect;
export type NewCoupon = typeof coupon.$inferInsert;

export type CouponPlan = typeof couponPlan.$inferSelect;
export type NewCouponPlan = typeof couponPlan.$inferInsert;

export type CouponRedemption = typeof couponRedemption.$inferSelect;
export type NewCouponRedemption = typeof couponRedemption.$inferInsert;

export type BusinessRegistration = typeof businessRegistration.$inferSelect;
export type NewBusinessRegistration = typeof businessRegistration.$inferInsert;

export type BusinessProfile = typeof businessProfile.$inferSelect;
export type NewBusinessProfile = typeof businessProfile.$inferInsert;

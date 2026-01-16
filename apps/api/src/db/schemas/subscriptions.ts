import {
  pgTable,
  text,
  numeric,
  boolean,
  integer,
  date,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
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

// ... (keep usage of currencyEnum)

export const subscriptionPlan = pgTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  features: text("features"),
  limits: text("limits"),
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

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
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
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
});

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
});

const businessRegistrationStatusEnum = pgEnum("business_registration_status", [
  "pending",
  "approved",
  "rejected",
]);

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

export type Subscription = typeof subscription.$inferSelect;
export type NewSubscription = typeof subscription.$inferInsert;

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;

export type BusinessRegistration = typeof businessRegistration.$inferSelect;
export type NewBusinessRegistration = typeof businessRegistration.$inferInsert;

export type BusinessProfile = typeof businessProfile.$inferSelect;
export type NewBusinessProfile = typeof businessProfile.$inferInsert;

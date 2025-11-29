import {
  pgTable,
  text,
  numeric,
  boolean,
  integer,
  date,
  timestamp,
  pgEnum
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// ============================================================================
// ENUMS
// ============================================================================

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "quarterly",
  "yearly"
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "expired",
  "cancelled",
  "pending",
  "trial"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "success",
  "failed",
  "pending",
  "refunded"
]);

export const currencyEnum = pgEnum("currency", ["TRY", "USD", "EUR"]);

// ============================================================================
// SUBSCRIPTION PLANS TABLE
// ============================================================================

export const subscriptionPlan = pgTable("subscription_plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Temel Paket", "Premium Paket"
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  features: text("features"), // JSON array of feature descriptions
  limits: text("limits"), // JSON object for usage limits
  active: boolean("active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// SUBSCRIPTIONS TABLE
// ============================================================================

export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  planId: text("plan_id")
    .notNull()
    .references(() => subscriptionPlan.id, { onDelete: "cascade" }),
  status: subscriptionStatusEnum("status").notNull().default("pending"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  nextBillingDate: date("next_billing_date"),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  usage: text("usage"), // JSON object for current usage tracking
  paymentMethod: text("payment_method"), // JSON object for payment method details
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================================
// PAYMENTS TABLE
// ============================================================================

export const payment = pgTable("payment", {
  id: text("id").primaryKey(),
  subscriptionId: text("subscription_id").references(() => subscription.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"), // JSON object for payment method used
  gatewayResponse: text("gateway_response"), // JSON object for payment gateway response
  invoiceId: text("invoice_id"), // Invoice identifier
  paidAt: timestamp("paid_at", { withTimezone: true }),
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
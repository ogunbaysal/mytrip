import { pgTable, uuid, varchar, text, timestamp, pgEnum, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { subscriptions } from "./subscriptions";

export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded']);
export const paymentTypeEnum = pgEnum('payment_type', ['subscription', 'one_time', 'refund']);

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id),
  
  // Payment details
  type: paymentTypeEnum('type').notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  
  // Amount and currency
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('TRY'),
  
  // External payment gateway integration
  externalPaymentId: varchar('external_payment_id', { length: 255 }),
  paymentGateway: varchar('payment_gateway', { length: 50 }).notNull(), // stripe, iyzico, etc.
  paymentMethod: varchar('payment_method', { length: 50 }), // card, bank_transfer, etc.
  
  // Gateway response data
  gatewayResponse: jsonb('gateway_response'),
  gatewayFees: decimal('gateway_fees', { precision: 10, scale: 2 }),
  
  // Invoice and receipt
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  receiptUrl: varchar('receipt_url', { length: 500 }),
  
  // Payment method details (encrypted/tokenized)
  cardLast4: varchar('card_last4', { length: 4 }),
  cardBrand: varchar('card_brand', { length: 20 }),
  
  // Failure details
  failureCode: varchar('failure_code', { length: 50 }),
  failureMessage: text('failure_message'),
  
  // Refund information
  refundedAmount: decimal('refunded_amount', { precision: 10, scale: 2 }),
  refundedAt: timestamp('refunded_at', { withTimezone: true }),
  refundReason: text('refund_reason'),
  
  // Timestamps
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  return {
    userIdIdx: index('payments_user_id_idx').on(table.userId),
    subscriptionIdIdx: index('payments_subscription_id_idx').on(table.subscriptionId),
    statusIdx: index('payments_status_idx').on(table.status),
    externalIdIdx: index('payments_external_id_idx').on(table.externalPaymentId),
    invoiceIdx: index('payments_invoice_idx').on(table.invoiceNumber),
    typeStatusIdx: index('payments_type_status_idx').on(table.type, table.status),
  };
});

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

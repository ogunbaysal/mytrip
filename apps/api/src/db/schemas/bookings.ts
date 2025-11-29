import {
  pgTable,
  text,
  integer,
  numeric,
  date,
  timestamp,
  pgEnum
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { place } from "./places";

// ============================================================================
// ENUMS
// ============================================================================

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed"
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "refunded"
]);

export const currencyEnum = pgEnum("currency", ["TRY", "USD", "EUR"]);

// ============================================================================
// BOOKINGS TABLE
// ============================================================================

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  placeId: text("place_id")
    .notNull()
    .references(() => place.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("TRY"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  specialRequests: text("special_requests"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  bookingReference: text("booking_reference").notNull().unique(),
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

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;
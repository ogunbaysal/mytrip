import {
  pgTable,
  text,
  integer,
  numeric,
  date,
  timestamp,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth.ts";
import { place } from "./places.ts";
import { hotelRoom } from "./place-hotel.ts";

// ============================================================================
// ENUMS
// ============================================================================

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "completed"
]);

export const bookingPaymentStatusEnum = pgEnum("booking_payment_status", [
  "pending",
  "paid",
  "refunded"
]);

export const bookingCurrencyEnum = pgEnum("booking_currency", ["TRY", "USD", "EUR"]);

// ============================================================================
// BOOKINGS TABLE
// ============================================================================

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  placeId: text("place_id")
    .notNull()
    .references(() => place.id, { onDelete: "cascade" }),
  roomId: text("room_id").references(() => hotelRoom.id, {
    onDelete: "set null",
  }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  guests: integer("guests").notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  currency: bookingCurrencyEnum("currency").notNull().default("TRY"),
  status: bookingStatusEnum("status").notNull().default("pending"),
  specialRequests: text("special_requests"),
  pricingSnapshot: text("pricing_snapshot"),
  paymentStatus: bookingPaymentStatusEnum("payment_status")
    .notNull()
    .default("pending"),
  bookingReference: text("booking_reference").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  index("booking_place_status_dates_idx").on(
    table.placeId,
    table.status,
    table.checkInDate,
    table.checkOutDate,
  ),
  index("booking_room_status_dates_idx").on(
    table.roomId,
    table.status,
    table.checkInDate,
    table.checkOutDate,
  ),
]);

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type Booking = typeof booking.$inferSelect;
export type NewBooking = typeof booking.$inferInsert;

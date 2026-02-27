import {
  check,
  date,
  index,
  pgTable,
  text,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { place } from "./places.ts";
import { hotelRoom } from "./place-hotel.ts";

export const placePriceRule = pgTable(
  "place_price_rule",
  {
    id: text("id").primaryKey(),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("place_price_rule_date_order_ck", sql`${table.startsOn} <= ${table.endsOn}`),
    index("place_price_rule_place_dates_idx").on(
      table.placeId,
      table.startsOn,
      table.endsOn,
    ),
  ],
);

export const placeAvailabilityBlock = pgTable(
  "place_availability_block",
  {
    id: text("id").primaryKey(),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "place_availability_block_date_order_ck",
      sql`${table.startsOn} <= ${table.endsOn}`,
    ),
    index("place_availability_block_place_dates_idx").on(
      table.placeId,
      table.startsOn,
      table.endsOn,
    ),
  ],
);

export const hotelRoomAvailabilityBlock = pgTable(
  "hotel_room_availability_block",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => hotelRoom.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "hotel_room_availability_block_date_order_ck",
      sql`${table.startsOn} <= ${table.endsOn}`,
    ),
    index("hotel_room_availability_block_room_dates_idx").on(
      table.roomId,
      table.startsOn,
      table.endsOn,
    ),
  ],
);

export type PlacePriceRule = typeof placePriceRule.$inferSelect;
export type NewPlacePriceRule = typeof placePriceRule.$inferInsert;

export type PlaceAvailabilityBlock = typeof placeAvailabilityBlock.$inferSelect;
export type NewPlaceAvailabilityBlock = typeof placeAvailabilityBlock.$inferInsert;

export type HotelRoomAvailabilityBlock = typeof hotelRoomAvailabilityBlock.$inferSelect;
export type NewHotelRoomAvailabilityBlock = typeof hotelRoomAvailabilityBlock.$inferInsert;

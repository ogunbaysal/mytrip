import {
  pgTable,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
  pgEnum,
  index,
  primaryKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { file } from "./files.ts";
import { place } from "./places.ts";

export const hotelRoomStatusEnum = pgEnum("hotel_room_status", [
  "active",
  "inactive",
  "maintenance",
]);

export const hotelRoom = pgTable(
  "hotel_room",
  {
    id: text("id").primaryKey(),
    placeId: text("place_id")
      .notNull()
      .references(() => place.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    maxAdults: integer("max_adults").notNull().default(2),
    maxChildren: integer("max_children").notNull().default(0),
    bedCount: integer("bed_count"),
    bathroomCount: integer("bathroom_count"),
    areaSqm: numeric("area_sqm", { precision: 10, scale: 2 }),
    baseNightlyPrice: numeric("base_nightly_price", { precision: 10, scale: 2 }),
    status: hotelRoomStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("hotel_room_place_slug_uniq").on(table.placeId, table.slug),
    index("hotel_room_place_status_idx").on(table.placeId, table.status),
  ],
);

export const hotelRoomFeature = pgTable(
  "hotel_room_feature",
  {
    roomId: text("room_id")
      .notNull()
      .references(() => hotelRoom.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    value: text("value"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.key], name: "hotel_room_feature_pk" }),
    index("hotel_room_feature_room_sort_idx").on(table.roomId, table.sortOrder),
  ],
);

export const hotelRoomMedia = pgTable(
  "hotel_room_media",
  {
    roomId: text("room_id")
      .notNull()
      .references(() => hotelRoom.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => file.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.roomId, table.fileId], name: "hotel_room_media_pk" }),
    uniqueIndex("hotel_room_media_room_sort_uniq").on(table.roomId, table.sortOrder),
  ],
);

export const hotelRoomRate = pgTable(
  "hotel_room_rate",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => hotelRoom.id, { onDelete: "cascade" }),
    startsOn: date("starts_on").notNull(),
    endsOn: date("ends_on").notNull(),
    nightlyPrice: numeric("nightly_price", { precision: 10, scale: 2 }).notNull(),
    minStayNights: integer("min_stay_nights").notNull().default(1),
    maxStayNights: integer("max_stay_nights"),
    isRefundable: boolean("is_refundable").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("hotel_room_rate_room_dates_idx").on(table.roomId, table.startsOn, table.endsOn),
  ],
);

export const hotelReservationPolicy = pgTable("hotel_reservation_policy", {
  placeId: text("place_id")
    .primaryKey()
    .references(() => place.id, { onDelete: "cascade" }),
  checkInFromHour: integer("check_in_from_hour"),
  checkOutUntilHour: integer("check_out_until_hour"),
  freeCancellationUntilHours: integer("free_cancellation_until_hours"),
  policyText: text("policy_text"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

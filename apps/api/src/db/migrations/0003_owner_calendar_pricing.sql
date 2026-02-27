ALTER TABLE "booking"
ADD COLUMN "room_id" text;
--> statement-breakpoint
ALTER TABLE "booking"
ADD COLUMN "pricing_snapshot" text;
--> statement-breakpoint
ALTER TABLE "booking"
ADD CONSTRAINT "booking_room_id_hotel_room_id_fk"
FOREIGN KEY ("room_id")
REFERENCES "public"."hotel_room"("id")
ON DELETE set null
ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "booking_place_status_dates_idx"
ON "booking" USING btree ("place_id", "status", "check_in_date", "check_out_date");
--> statement-breakpoint
CREATE INDEX "booking_room_status_dates_idx"
ON "booking" USING btree ("room_id", "status", "check_in_date", "check_out_date");
--> statement-breakpoint
CREATE TABLE "place_price_rule" (
  "id" text PRIMARY KEY NOT NULL,
  "place_id" text NOT NULL,
  "starts_on" date NOT NULL,
  "ends_on" date NOT NULL,
  "nightly_price" numeric(10, 2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "place_price_rule_date_order_ck" CHECK ("place_price_rule"."starts_on" <= "place_price_rule"."ends_on")
);
--> statement-breakpoint
ALTER TABLE "place_price_rule"
ADD CONSTRAINT "place_price_rule_place_id_place_id_fk"
FOREIGN KEY ("place_id")
REFERENCES "public"."place"("id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "place_price_rule_place_dates_idx"
ON "place_price_rule" USING btree ("place_id", "starts_on", "ends_on");
--> statement-breakpoint
CREATE TABLE "place_availability_block" (
  "id" text PRIMARY KEY NOT NULL,
  "place_id" text NOT NULL,
  "starts_on" date NOT NULL,
  "ends_on" date NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "place_availability_block_date_order_ck" CHECK ("place_availability_block"."starts_on" <= "place_availability_block"."ends_on")
);
--> statement-breakpoint
ALTER TABLE "place_availability_block"
ADD CONSTRAINT "place_availability_block_place_id_place_id_fk"
FOREIGN KEY ("place_id")
REFERENCES "public"."place"("id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "place_availability_block_place_dates_idx"
ON "place_availability_block" USING btree ("place_id", "starts_on", "ends_on");
--> statement-breakpoint
CREATE TABLE "hotel_room_availability_block" (
  "id" text PRIMARY KEY NOT NULL,
  "room_id" text NOT NULL,
  "starts_on" date NOT NULL,
  "ends_on" date NOT NULL,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "hotel_room_availability_block_date_order_ck" CHECK ("hotel_room_availability_block"."starts_on" <= "hotel_room_availability_block"."ends_on")
);
--> statement-breakpoint
ALTER TABLE "hotel_room_availability_block"
ADD CONSTRAINT "hotel_room_availability_block_room_id_hotel_room_id_fk"
FOREIGN KEY ("room_id")
REFERENCES "public"."hotel_room"("id")
ON DELETE cascade
ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "hotel_room_availability_block_room_dates_idx"
ON "hotel_room_availability_block" USING btree ("room_id", "starts_on", "ends_on");

CREATE TABLE "place_image" (
	"place_id" text NOT NULL,
	"file_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_image_pk" PRIMARY KEY("place_id","file_id")
);
--> statement-breakpoint
ALTER TABLE "place" DROP CONSTRAINT "place_category_id_place_category_id_fk";
--> statement-breakpoint
ALTER TABLE "place" ADD COLUMN "city_id" text;--> statement-breakpoint
ALTER TABLE "place" ADD COLUMN "district_id" text;--> statement-breakpoint
ALTER TABLE "place_image" ADD CONSTRAINT "place_image_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_image" ADD CONSTRAINT "place_image_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "place_image_place_sort_order_uniq" ON "place_image" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_image_place_sort_idx" ON "place_image" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_image_file_id_idx" ON "place_image" USING btree ("file_id");--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_city_id_province_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."province"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_district_id_district_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."district"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_category_id_place_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."place_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "place_category_id_idx" ON "place" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "place_city_id_idx" ON "place" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "place_district_id_idx" ON "place" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "place_owner_id_idx" ON "place" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "place_status_idx" ON "place" USING btree ("status");--> statement-breakpoint
CREATE INDEX "place_featured_idx" ON "place" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "place_verified_idx" ON "place" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "place_created_at_idx" ON "place" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "category";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "city";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "district";--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "images";--> statement-breakpoint
DROP TYPE "public"."place_type";
CREATE TABLE "amenity" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amenity_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "place_amenity" (
	"place_id" text NOT NULL,
	"amenity_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_amenity_pk" PRIMARY KEY("place_id","amenity_id")
);
--> statement-breakpoint
ALTER TABLE "place_amenity" ADD CONSTRAINT "place_amenity_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_amenity" ADD CONSTRAINT "place_amenity_amenity_id_amenity_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "amenity_slug_idx" ON "amenity" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "amenity_label_idx" ON "amenity" USING btree ("label");--> statement-breakpoint
CREATE UNIQUE INDEX "place_amenity_place_sort_order_uniq" ON "place_amenity" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_amenity_place_sort_idx" ON "place_amenity" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_amenity_amenity_id_idx" ON "place_amenity" USING btree ("amenity_id");--> statement-breakpoint
ALTER TABLE "place" DROP COLUMN "features";
ALTER TYPE "public"."place_status" ADD VALUE 'rejected';--> statement-breakpoint
CREATE TABLE "business_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"logo" text,
	"description" text,
	"website" text,
	"social_media" text,
	"business_hours" text,
	"response_time" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_profile_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "business_registration" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"company_name" text NOT NULL,
	"tax_id" text NOT NULL,
	"business_address" text,
	"contact_phone" text,
	"contact_email" text,
	"business_type" text,
	"documents" text,
	"status" "business_registration_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "district" (
	"id" text PRIMARY KEY NOT NULL,
	"province_id" text NOT NULL,
	"province_code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"postal_code" text,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "province" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"latitude" numeric(10, 7),
	"longitude" numeric(10, 7),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "province_code_unique" UNIQUE("code"),
	CONSTRAINT "province_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_registration" ADD CONSTRAINT "business_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_registration" ADD CONSTRAINT "business_registration_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "district" ADD CONSTRAINT "district_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "district_province_id_idx" ON "district" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "district_province_code_idx" ON "district" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "district_name_idx" ON "district" USING btree ("name");--> statement-breakpoint
CREATE INDEX "province_code_idx" ON "province" USING btree ("code");--> statement-breakpoint
CREATE INDEX "province_name_idx" ON "province" USING btree ("name");
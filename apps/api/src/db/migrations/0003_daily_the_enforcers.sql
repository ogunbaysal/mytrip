CREATE TYPE "public"."coupon_discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."coupon_scope" AS ENUM('all_plans', 'specific_plans');--> statement-breakpoint
CREATE TABLE "coupon" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"description" text,
	"discount_type" "coupon_discount_type" NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"scope" "coupon_scope" DEFAULT 'all_plans' NOT NULL,
	"max_redemptions" integer,
	"max_redemptions_per_user" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "coupon_percent_range_check" CHECK ("coupon"."discount_type" <> 'percent' OR ("coupon"."discount_value" >= 0 AND "coupon"."discount_value" <= 100)),
	CONSTRAINT "coupon_fixed_positive_check" CHECK ("coupon"."discount_type" <> 'fixed' OR "coupon"."discount_value" > 0)
);
--> statement-breakpoint
CREATE TABLE "coupon_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupon_redemption" (
	"id" text PRIMARY KEY NOT NULL,
	"coupon_id" text NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text,
	"plan_id" text,
	"discount_amount" numeric(10, 2) NOT NULL,
	"final_amount" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"redeemed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plan_feature" (
	"id" text PRIMARY KEY NOT NULL,
	"plan_id" text NOT NULL,
	"label" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "subscription_plan" ADD COLUMN "max_places" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "base_price" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "coupon_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "coupon_code" text;--> statement-breakpoint
ALTER TABLE "subscription_plan" ADD COLUMN "max_blogs" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
UPDATE "subscription_plan"
SET
	"max_places" = CASE
		WHEN "limits" IS NULL THEN 1
		WHEN ("limits"::jsonb ->> 'maxPlaces') ~ '^[0-9]+$' THEN ("limits"::jsonb ->> 'maxPlaces')::integer
		ELSE 1
	END,
	"max_blogs" = CASE
		WHEN "limits" IS NULL THEN 1
		WHEN ("limits"::jsonb ->> 'maxBlogs') ~ '^[0-9]+$' THEN ("limits"::jsonb ->> 'maxBlogs')::integer
		ELSE 1
	END;--> statement-breakpoint
UPDATE "subscription_plan" SET "billing_cycle" = 'yearly' WHERE "billing_cycle" <> 'yearly';--> statement-breakpoint
UPDATE "subscription" SET "billing_cycle" = 'yearly' WHERE "billing_cycle" <> 'yearly';--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_plan" ADD CONSTRAINT "coupon_plan_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_plan" ADD CONSTRAINT "coupon_plan_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plan_feature" ADD CONSTRAINT "subscription_plan_feature_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_code_uniq" ON "coupon" USING btree ("code");--> statement-breakpoint
CREATE INDEX "coupon_active_idx" ON "coupon" USING btree ("active");--> statement-breakpoint
CREATE INDEX "coupon_starts_at_idx" ON "coupon" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "coupon_ends_at_idx" ON "coupon" USING btree ("ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "coupon_plan_coupon_id_plan_id_uniq" ON "coupon_plan" USING btree ("coupon_id","plan_id");--> statement-breakpoint
CREATE INDEX "coupon_plan_coupon_id_idx" ON "coupon_plan" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_plan_plan_id_idx" ON "coupon_plan" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_coupon_id_idx" ON "coupon_redemption" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_user_id_idx" ON "coupon_redemption" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_subscription_id_idx" ON "coupon_redemption" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "coupon_redemption_coupon_user_idx" ON "coupon_redemption" USING btree ("coupon_id","user_id");--> statement-breakpoint
CREATE INDEX "subscription_plan_feature_plan_sort_idx" ON "subscription_plan_feature" USING btree ("plan_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plan_feature_plan_label_uniq" ON "subscription_plan_feature" USING btree ("plan_id","label");--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_subscription_id_idx" ON "payment" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_user_status_idx" ON "subscription" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "subscription_plan_id_idx" ON "subscription" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscription_coupon_id_idx" ON "subscription" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "subscription_next_billing_date_idx" ON "subscription" USING btree ("next_billing_date");--> statement-breakpoint
CREATE INDEX "subscription_plan_billing_cycle_idx" ON "subscription_plan" USING btree ("billing_cycle");--> statement-breakpoint
CREATE INDEX "subscription_plan_sort_order_idx" ON "subscription_plan" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "subscription_plan" DROP COLUMN "features";--> statement-breakpoint
ALTER TABLE "subscription_plan" DROP COLUMN "limits";

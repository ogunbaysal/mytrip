CREATE TYPE "public"."blog_status" AS ENUM('draft', 'pending', 'approved', 'published', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."blog_type" AS ENUM('editorial', 'owner', 'collection');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."user_type" AS ENUM('traveler', 'owner', 'admin');--> statement-breakpoint
CREATE TYPE "public"."place_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."place_type" AS ENUM('hotel', 'restaurant', 'villa', 'flat', 'activity');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."plan_type" AS ENUM('basic', 'premium', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'inactive', 'cancelled', 'past_due', 'paused');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('subscription', 'one_time', 'refund');--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"type" "blog_type" DEFAULT 'editorial' NOT NULL,
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"title" varchar(255) NOT NULL,
	"title_en" varchar(255),
	"slug" varchar(255) NOT NULL,
	"slug_en" varchar(255),
	"content" text NOT NULL,
	"content_en" text,
	"excerpt" text,
	"excerpt_en" text,
	"meta_title" varchar(255),
	"meta_title_en" varchar(255),
	"meta_description" varchar(500),
	"meta_description_en" varchar(500),
	"featured_image" varchar(500),
	"images" jsonb,
	"categories" jsonb,
	"tags" jsonb,
	"view_count" text DEFAULT '0',
	"read_time" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" text DEFAULT '0',
	"related_places" jsonb,
	"related_blogs" jsonb,
	"published_at" timestamp with time zone,
	"scheduled_at" timestamp with time zone,
	"admin_notes" text,
	"rejection_reason" text,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blogs_slug_unique" UNIQUE("slug"),
	CONSTRAINT "blogs_slug_en_unique" UNIQUE("slug_en")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"slug" varchar(255) NOT NULL,
	"slug_en" varchar(255),
	"description" text,
	"description_en" text,
	"short_description" varchar(500),
	"short_description_en" varchar(500),
	"meta_title" varchar(255),
	"meta_title_en" varchar(255),
	"meta_description" varchar(500),
	"meta_description_en" varchar(500),
	"featured_image" varchar(500),
	"images" jsonb,
	"is_public" boolean DEFAULT true NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"featured_order" text DEFAULT '0',
	"place_ids" jsonb,
	"blog_ids" jsonb,
	"tags" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collections_slug_unique" UNIQUE("slug"),
	CONSTRAINT "collections_slug_en_unique" UNIQUE("slug_en")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"user_type" "user_type" DEFAULT 'traveler' NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"language_preference" varchar(5) DEFAULT 'tr' NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"type" "place_type" NOT NULL,
	"status" "place_status" DEFAULT 'draft' NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"slug" varchar(255) NOT NULL,
	"slug_en" varchar(255),
	"description" text NOT NULL,
	"description_en" text,
	"short_description" varchar(500),
	"short_description_en" varchar(500),
	"address" text NOT NULL,
	"address_en" text,
	"city" varchar(100) NOT NULL,
	"district" varchar(100),
	"postal_code" varchar(10),
	"latitude" numeric(10, 7) NOT NULL,
	"longitude" numeric(10, 7) NOT NULL,
	"phone" varchar(20),
	"email" varchar(255),
	"website" varchar(500),
	"type_specific_data" jsonb,
	"meta_title" varchar(255),
	"meta_title_en" varchar(255),
	"meta_description" varchar(500),
	"meta_description_en" varchar(500),
	"featured_image" varchar(500),
	"images" jsonb,
	"price_range" varchar(50),
	"average_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'TRY',
	"amenities" jsonb,
	"tags" jsonb,
	"admin_notes" text,
	"rejection_reason" text,
	"view_count" numeric(10, 0) DEFAULT '0',
	"last_viewed_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "places_slug_unique" UNIQUE("slug"),
	CONSTRAINT "places_slug_en_unique" UNIQUE("slug_en")
);
--> statement-breakpoint
CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"name_en" varchar(100),
	"description" text,
	"description_en" text,
	"plan_type" "plan_type" NOT NULL,
	"monthly_price" numeric(10, 2) NOT NULL,
	"yearly_price" numeric(10, 2),
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"features" jsonb,
	"max_listings" text DEFAULT '1',
	"max_images" text DEFAULT '10',
	"max_blog_posts" text DEFAULT '5',
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" text DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan_id" uuid NOT NULL,
	"status" "subscription_status" DEFAULT 'active' NOT NULL,
	"billing_cycle" "billing_cycle" DEFAULT 'monthly' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"payment_method" varchar(50),
	"external_subscription_id" varchar(255),
	"payment_gateway" varchar(50),
	"gateway_data" jsonb,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subscription_id" uuid,
	"type" "payment_type" NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'TRY' NOT NULL,
	"external_payment_id" varchar(255),
	"payment_gateway" varchar(50) NOT NULL,
	"payment_method" varchar(50),
	"gateway_response" jsonb,
	"gateway_fees" numeric(10, 2),
	"invoice_number" varchar(100),
	"receipt_url" varchar(500),
	"card_last4" varchar(4),
	"card_brand" varchar(20),
	"failure_code" varchar(50),
	"failure_message" text,
	"refunded_amount" numeric(10, 2),
	"refunded_at" timestamp with time zone,
	"refund_reason" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_subscription_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blogs_author_id_idx" ON "blogs" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blogs_status_idx" ON "blogs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blogs_type_idx" ON "blogs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "blogs_slug_idx" ON "blogs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blogs_slug_en_idx" ON "blogs" USING btree ("slug_en");--> statement-breakpoint
CREATE INDEX "blogs_featured_idx" ON "blogs" USING btree ("is_featured","featured_order");--> statement-breakpoint
CREATE INDEX "blogs_published_idx" ON "blogs" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "collections_created_by_idx" ON "collections" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "collections_slug_idx" ON "collections" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "collections_slug_en_idx" ON "collections" USING btree ("slug_en");--> statement-breakpoint
CREATE INDEX "collections_featured_idx" ON "collections" USING btree ("is_featured","featured_order");--> statement-breakpoint
CREATE INDEX "collections_public_idx" ON "collections" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "places_owner_id_idx" ON "places" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "places_type_idx" ON "places" USING btree ("type");--> statement-breakpoint
CREATE INDEX "places_status_idx" ON "places" USING btree ("status");--> statement-breakpoint
CREATE INDEX "places_location_idx" ON "places" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "places_slug_idx" ON "places" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "places_slug_en_idx" ON "places" USING btree ("slug_en");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_plan_id_idx" ON "subscriptions" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscriptions_external_id_idx" ON "subscriptions" USING btree ("external_subscription_id");--> statement-breakpoint
CREATE INDEX "subscriptions_period_idx" ON "subscriptions" USING btree ("current_period_start","current_period_end");--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payments_subscription_id_idx" ON "payments" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payments_external_id_idx" ON "payments" USING btree ("external_payment_id");--> statement-breakpoint
CREATE INDEX "payments_invoice_idx" ON "payments" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "payments_type_status_idx" ON "payments" USING btree ("type","status");
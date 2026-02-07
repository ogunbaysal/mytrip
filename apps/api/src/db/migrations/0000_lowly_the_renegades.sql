CREATE TYPE "public"."admin_status" AS ENUM('active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'expired', 'cancelled', 'pending', 'trial');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'traveler');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'pending');--> statement-breakpoint
CREATE TYPE "public"."blog_comment_status" AS ENUM('pending', 'published', 'rejected', 'spam');--> statement-breakpoint
CREATE TYPE "public"."blog_status" AS ENUM('published', 'draft', 'archived', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('tr', 'en');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."currency" AS ENUM('TRY', 'USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('success', 'failed', 'pending', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."collection_status" AS ENUM('published', 'draft', 'archived');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('image', 'document', 'video', 'audio', 'other');--> statement-breakpoint
CREATE TYPE "public"."file_usage" AS ENUM('blog_hero', 'blog_featured', 'blog_content', 'place_image', 'place_gallery', 'business_document', 'profile_avatar', 'profile_cover', 'other');--> statement-breakpoint
CREATE TYPE "public"."billing_cycle" AS ENUM('monthly', 'quarterly', 'yearly');--> statement-breakpoint
CREATE TYPE "public"."coupon_discount_type" AS ENUM('percent', 'fixed');--> statement-breakpoint
CREATE TYPE "public"."coupon_scope" AS ENUM('all_plans', 'specific_plans');--> statement-breakpoint
CREATE TYPE "public"."place_status" AS ENUM('active', 'inactive', 'pending', 'suspended', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."price_level" AS ENUM('budget', 'moderate', 'expensive', 'luxury');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('published', 'hidden', 'flagged');--> statement-breakpoint
CREATE TYPE "public"."business_registration_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."provider" AS ENUM('iyzico', 'paytr', 'stripe', 'mock');--> statement-breakpoint
CREATE TABLE "analytics_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"user_id" text,
	"place_id" text,
	"session_id" text NOT NULL,
	"metadata" text,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role_id" text,
	"status" "admin_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "admin_account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_permissions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "admin_role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "admin_session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "admin_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admin_verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'traveler' NOT NULL,
	"phone" text,
	"bio" text,
	"avatar" text,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"last_login_at" timestamp with time zone,
	"place_count" integer DEFAULT 0 NOT NULL,
	"subscription_status" "subscription_status",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text,
	"content" text,
	"hero_image_id" text,
	"featured_image_id" text,
	"category_id" text,
	"tags" text,
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"author_id" text,
	"published_at" timestamp with time zone,
	"views" integer DEFAULT 0 NOT NULL,
	"read_time" integer,
	"like_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"seo_keywords" text,
	"language" "language" DEFAULT 'tr' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_category" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "blog_comment" (
	"id" text PRIMARY KEY NOT NULL,
	"blog_id" text NOT NULL,
	"user_id" text,
	"guest_name" text,
	"guest_email" text,
	"content" text NOT NULL,
	"status" "blog_comment_status" DEFAULT 'pending' NOT NULL,
	"admin_note" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blog_image" (
	"blog_id" text NOT NULL,
	"file_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_image_pk" PRIMARY KEY("blog_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"user_id" text NOT NULL,
	"check_in_date" date NOT NULL,
	"check_out_date" date NOT NULL,
	"guests" integer NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"special_requests" text,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"booking_reference" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "booking_booking_reference_unique" UNIQUE("booking_reference")
);
--> statement-breakpoint
CREATE TABLE "place_category" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_category_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "collection" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"cover_image" text,
	"hero_image" text,
	"intro" text,
	"duration" text,
	"season" text,
	"best_for" text,
	"highlights" text,
	"itinerary" text,
	"tips" text,
	"featured_places" text,
	"item_count" integer DEFAULT 0 NOT NULL,
	"status" "collection_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "file" (
	"id" text PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"stored_filename" text NOT NULL,
	"url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"type" "file_type" DEFAULT 'image' NOT NULL,
	"usage" "file_usage" DEFAULT 'other' NOT NULL,
	"uploaded_by_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "payment" (
	"id" text PRIMARY KEY NOT NULL,
	"subscription_id" text,
	"user_id" text NOT NULL,
	"provider" "provider" DEFAULT 'iyzico' NOT NULL,
	"provider_transaction_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"gateway_response" text,
	"invoice_id" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"provider" "provider" DEFAULT 'iyzico' NOT NULL,
	"provider_subscription_id" text,
	"base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
	"discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"coupon_id" text,
	"coupon_code" text,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"next_billing_date" date,
	"cancelled_at" timestamp with time zone,
	"trial_ends_at" timestamp with time zone,
	"usage" text,
	"payment_method" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" "currency" DEFAULT 'TRY' NOT NULL,
	"billing_cycle" "billing_cycle" NOT NULL,
	"max_places" integer DEFAULT 1 NOT NULL,
	"max_blogs" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "amenity" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "amenity_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "place" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"category_id" text,
	"description" text,
	"short_description" text,
	"address" text,
	"city_id" text,
	"district_id" text,
	"location" text,
	"contact_info" text,
	"business_document_file_id" text,
	"rating" numeric(3, 2) DEFAULT '0.00',
	"review_count" integer DEFAULT 0 NOT NULL,
	"price_level" "price_level",
	"nightly_price" numeric(10, 2),
	"status" "place_status" DEFAULT 'pending' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"owner_id" text,
	"views" integer DEFAULT 0 NOT NULL,
	"booking_count" integer DEFAULT 0 NOT NULL,
	"opening_hours" text,
	"check_in_info" text,
	"check_out_info" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_slug_unique" UNIQUE("slug")
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
CREATE TABLE "place_image" (
	"place_id" text NOT NULL,
	"file_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_image_pk" PRIMARY KEY("place_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "review" (
	"id" text PRIMARY KEY NOT NULL,
	"place_id" text NOT NULL,
	"user_id" text NOT NULL,
	"rating" integer NOT NULL,
	"title" text,
	"content" text,
	"images" text,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"verified_stay" boolean DEFAULT false NOT NULL,
	"response" text,
	"response_date" timestamp with time zone,
	"status" "review_status" DEFAULT 'published' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_event" ADD CONSTRAINT "analytics_event_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin" ADD CONSTRAINT "admin_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_account" ADD CONSTRAINT "admin_account_user_id_admin_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_role_id_admin_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."admin_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_role_permissions" ADD CONSTRAINT "admin_role_permissions_permission_id_admin_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."admin_permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_session" ADD CONSTRAINT "admin_session_user_id_admin_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_hero_image_id_file_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_featured_image_id_file_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_category_id_blog_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_image" ADD CONSTRAINT "blog_image_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_image" ADD CONSTRAINT "blog_image_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profile" ADD CONSTRAINT "business_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_registration" ADD CONSTRAINT "business_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_registration" ADD CONSTRAINT "business_registration_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon" ADD CONSTRAINT "coupon_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_plan" ADD CONSTRAINT "coupon_plan_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_plan" ADD CONSTRAINT "coupon_plan_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coupon_redemption" ADD CONSTRAINT "coupon_redemption_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_subscription_id_subscription_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment" ADD CONSTRAINT "payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_coupon_id_coupon_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupon"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_plan_feature" ADD CONSTRAINT "subscription_plan_feature_plan_id_subscription_plan_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."subscription_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "district" ADD CONSTRAINT "district_province_id_province_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."province"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_category_id_place_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."place_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_city_id_province_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."province"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_district_id_district_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."district"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_business_document_file_id_file_id_fk" FOREIGN KEY ("business_document_file_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_amenity" ADD CONSTRAINT "place_amenity_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_amenity" ADD CONSTRAINT "place_amenity_amenity_id_amenity_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_image" ADD CONSTRAINT "place_image_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_image" ADD CONSTRAINT "place_image_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_place_id_place_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."place"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review" ADD CONSTRAINT "review_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "blog_category_id_idx" ON "blog" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "blog_author_id_idx" ON "blog" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blog_status_idx" ON "blog" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_featured_idx" ON "blog" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "blog_published_at_idx" ON "blog" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "blog_created_at_idx" ON "blog" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_hero_image_id_idx" ON "blog" USING btree ("hero_image_id");--> statement-breakpoint
CREATE INDEX "blog_featured_image_id_idx" ON "blog" USING btree ("featured_image_id");--> statement-breakpoint
CREATE INDEX "blog_category_slug_idx" ON "blog_category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blog_category_active_idx" ON "blog_category" USING btree ("active");--> statement-breakpoint
CREATE INDEX "blog_category_sort_order_idx" ON "blog_category" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "blog_comment_blog_id_idx" ON "blog_comment" USING btree ("blog_id");--> statement-breakpoint
CREATE INDEX "blog_comment_status_idx" ON "blog_comment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_comment_created_at_idx" ON "blog_comment" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "blog_comment_user_id_idx" ON "blog_comment" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "blog_image_blog_sort_order_uniq" ON "blog_image" USING btree ("blog_id","sort_order");--> statement-breakpoint
CREATE INDEX "blog_image_blog_sort_idx" ON "blog_image" USING btree ("blog_id","sort_order");--> statement-breakpoint
CREATE INDEX "blog_image_file_id_idx" ON "blog_image" USING btree ("file_id");--> statement-breakpoint
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
CREATE INDEX "payment_subscription_id_idx" ON "payment" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "payment_user_id_idx" ON "payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_status_idx" ON "payment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "subscription_user_status_idx" ON "subscription" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "subscription_plan_id_idx" ON "subscription" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "subscription_coupon_id_idx" ON "subscription" USING btree ("coupon_id");--> statement-breakpoint
CREATE INDEX "subscription_next_billing_date_idx" ON "subscription" USING btree ("next_billing_date");--> statement-breakpoint
CREATE INDEX "subscription_plan_billing_cycle_idx" ON "subscription_plan" USING btree ("billing_cycle");--> statement-breakpoint
CREATE INDEX "subscription_plan_sort_order_idx" ON "subscription_plan" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "subscription_plan_feature_plan_sort_idx" ON "subscription_plan_feature" USING btree ("plan_id","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_plan_feature_plan_label_uniq" ON "subscription_plan_feature" USING btree ("plan_id","label");--> statement-breakpoint
CREATE INDEX "district_province_id_idx" ON "district" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "district_province_code_idx" ON "district" USING btree ("province_code");--> statement-breakpoint
CREATE INDEX "district_name_idx" ON "district" USING btree ("name");--> statement-breakpoint
CREATE INDEX "province_code_idx" ON "province" USING btree ("code");--> statement-breakpoint
CREATE INDEX "province_name_idx" ON "province" USING btree ("name");--> statement-breakpoint
CREATE INDEX "amenity_slug_idx" ON "amenity" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "amenity_label_idx" ON "amenity" USING btree ("label");--> statement-breakpoint
CREATE INDEX "place_category_id_idx" ON "place" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "place_city_id_idx" ON "place" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "place_district_id_idx" ON "place" USING btree ("district_id");--> statement-breakpoint
CREATE INDEX "place_business_document_file_id_idx" ON "place" USING btree ("business_document_file_id");--> statement-breakpoint
CREATE INDEX "place_owner_id_idx" ON "place" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "place_status_idx" ON "place" USING btree ("status");--> statement-breakpoint
CREATE INDEX "place_featured_idx" ON "place" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "place_verified_idx" ON "place" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "place_created_at_idx" ON "place" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "place_amenity_place_sort_order_uniq" ON "place_amenity" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_amenity_place_sort_idx" ON "place_amenity" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_amenity_amenity_id_idx" ON "place_amenity" USING btree ("amenity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "place_image_place_sort_order_uniq" ON "place_image" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_image_place_sort_idx" ON "place_image" USING btree ("place_id","sort_order");--> statement-breakpoint
CREATE INDEX "place_image_file_id_idx" ON "place_image" USING btree ("file_id");
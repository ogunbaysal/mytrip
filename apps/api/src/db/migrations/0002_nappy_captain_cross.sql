CREATE TYPE "public"."provider" AS ENUM('iyzico', 'paytr', 'stripe', 'mock');--> statement-breakpoint
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
CREATE TABLE "settings" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
ALTER TABLE "place" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "place" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "provider" "provider" DEFAULT 'iyzico' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" ADD COLUMN "provider_transaction_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "provider" "provider" DEFAULT 'iyzico' NOT NULL;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "provider_subscription_id" text;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_category_id_place_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."place_category"("id") ON DELETE no action ON UPDATE no action;
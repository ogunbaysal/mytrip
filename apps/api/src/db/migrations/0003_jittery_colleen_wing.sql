CREATE TYPE "public"."file_type" AS ENUM('image', 'document', 'video', 'audio', 'other');--> statement-breakpoint
CREATE TYPE "public"."file_usage" AS ENUM('blog_hero', 'blog_featured', 'blog_content', 'place_image', 'place_gallery', 'profile_avatar', 'profile_cover', 'other');--> statement-breakpoint
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
ALTER TABLE "file" ADD CONSTRAINT "file_uploaded_by_id_user_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
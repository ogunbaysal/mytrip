DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typnamespace = 'public'::regnamespace
      AND typname = 'blog_category'
      AND typtype = 'e'
  ) THEN
    ALTER TYPE "public"."blog_category" RENAME TO "blog_category_enum";
  END IF;
END $$;
--> statement-breakpoint
CREATE TYPE "public"."blog_comment_status" AS ENUM('pending', 'published', 'rejected', 'spam');
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
CREATE INDEX "blog_category_slug_idx" ON "blog_category" USING btree ("slug");
--> statement-breakpoint
CREATE INDEX "blog_category_active_idx" ON "blog_category" USING btree ("active");
--> statement-breakpoint
CREATE INDEX "blog_category_sort_order_idx" ON "blog_category" USING btree ("sort_order");
--> statement-breakpoint
INSERT INTO "blog_category" ("id", "slug", "name", "description", "sort_order", "active")
VALUES
  ('travel', 'travel', 'Seyahat', 'Seyahat rehberleri ve rota önerileri', 1, true),
  ('food', 'food', 'Yeme & İçme', 'Lezzet durakları ve gastronomi içerikleri', 2, true),
  ('culture', 'culture', 'Kültür', 'Yerel kültür, sanat ve yaşam içerikleri', 3, true),
  ('history', 'history', 'Tarih', 'Tarihi mekanlar ve hikayeler', 4, true),
  ('activity', 'activity', 'Aktivite', 'Deneyim ve aktivite önerileri', 5, true),
  ('lifestyle', 'lifestyle', 'Yaşam Tarzı', 'Konforlu yaşam ve seyahat ipuçları', 6, true),
  ('business', 'business', 'İşletme', 'İşletme sahipleri ve sektör içerikleri', 7, true)
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "blog_post" RENAME TO "blog";
--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "hero_image_id" text;
--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "featured_image_id" text;
--> statement-breakpoint
ALTER TABLE "blog" ADD COLUMN "category_id" text;
--> statement-breakpoint
CREATE TABLE "blog_image" (
  "blog_id" text NOT NULL,
  "file_id" text NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "blog_image_pk" PRIMARY KEY("blog_id", "file_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "blog_image_blog_sort_order_uniq" ON "blog_image" USING btree ("blog_id", "sort_order");
--> statement-breakpoint
CREATE INDEX "blog_image_blog_sort_idx" ON "blog_image" USING btree ("blog_id", "sort_order");
--> statement-breakpoint
CREATE INDEX "blog_image_file_id_idx" ON "blog_image" USING btree ("file_id");
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
CREATE INDEX "blog_comment_blog_id_idx" ON "blog_comment" USING btree ("blog_id");
--> statement-breakpoint
CREATE INDEX "blog_comment_status_idx" ON "blog_comment" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "blog_comment_created_at_idx" ON "blog_comment" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "blog_comment_user_id_idx" ON "blog_comment" USING btree ("user_id");
--> statement-breakpoint
WITH fallback_user AS (
  SELECT "id"
  FROM "user"
  ORDER BY "created_at" ASC
  LIMIT 1
), source AS (
  SELECT DISTINCT
    CONCAT('legacy-blog-hero-', md5(b."hero_image")) AS file_id,
    b."hero_image" AS url,
    COALESCE(b."author_id", fallback_user."id") AS uploaded_by
  FROM "blog" b
  LEFT JOIN fallback_user ON true
  WHERE b."hero_image" IS NOT NULL
    AND btrim(b."hero_image") <> ''
)
INSERT INTO "file" (
  "id",
  "filename",
  "stored_filename",
  "url",
  "mime_type",
  "size",
  "type",
  "usage",
  "uploaded_by_id"
)
SELECT
  source.file_id,
  split_part(source.url, '/', array_length(string_to_array(source.url, '/'), 1)),
  source.file_id,
  source.url,
  'application/octet-stream',
  0,
  'image'::"file_type",
  'blog_hero'::"file_usage",
  source.uploaded_by
FROM source
WHERE source.uploaded_by IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
WITH fallback_user AS (
  SELECT "id"
  FROM "user"
  ORDER BY "created_at" ASC
  LIMIT 1
), source AS (
  SELECT DISTINCT
    CONCAT('legacy-blog-featured-', md5(b."featured_image")) AS file_id,
    b."featured_image" AS url,
    COALESCE(b."author_id", fallback_user."id") AS uploaded_by
  FROM "blog" b
  LEFT JOIN fallback_user ON true
  WHERE b."featured_image" IS NOT NULL
    AND btrim(b."featured_image") <> ''
)
INSERT INTO "file" (
  "id",
  "filename",
  "stored_filename",
  "url",
  "mime_type",
  "size",
  "type",
  "usage",
  "uploaded_by_id"
)
SELECT
  source.file_id,
  split_part(source.url, '/', array_length(string_to_array(source.url, '/'), 1)),
  source.file_id,
  source.url,
  'application/octet-stream',
  0,
  'image'::"file_type",
  'blog_featured'::"file_usage",
  source.uploaded_by
FROM source
WHERE source.uploaded_by IS NOT NULL
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
WITH fallback_user AS (
  SELECT "id"
  FROM "user"
  ORDER BY "created_at" ASC
  LIMIT 1
), expanded AS (
  SELECT
    b."id" AS blog_id,
    btrim(img.value) AS url,
    img.ordinality::integer - 1 AS sort_order,
    COALESCE(b."author_id", fallback_user."id") AS uploaded_by
  FROM "blog" b
  LEFT JOIN fallback_user ON true
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
      WHEN b."images" IS NULL OR btrim(b."images") = '' THEN '[]'::jsonb
      WHEN left(btrim(b."images"), 1) = '[' THEN b."images"::jsonb
      ELSE to_jsonb(string_to_array(b."images", ','))
    END
  ) WITH ORDINALITY AS img(value, ordinality)
)
INSERT INTO "file" (
  "id",
  "filename",
  "stored_filename",
  "url",
  "mime_type",
  "size",
  "type",
  "usage",
  "uploaded_by_id"
)
SELECT DISTINCT
  CONCAT('legacy-blog-content-', md5(expanded.url)) AS file_id,
  split_part(expanded.url, '/', array_length(string_to_array(expanded.url, '/'), 1)),
  CONCAT('legacy-blog-content-', md5(expanded.url)),
  expanded.url,
  'application/octet-stream',
  0,
  'image'::"file_type",
  'blog_content'::"file_usage",
  expanded.uploaded_by
FROM expanded
WHERE expanded.uploaded_by IS NOT NULL
  AND expanded.url <> ''
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
WITH expanded AS (
  SELECT
    b."id" AS blog_id,
    btrim(img.value) AS url,
    img.ordinality::integer - 1 AS sort_order
  FROM "blog" b
  CROSS JOIN LATERAL jsonb_array_elements_text(
    CASE
      WHEN b."images" IS NULL OR btrim(b."images") = '' THEN '[]'::jsonb
      WHEN left(btrim(b."images"), 1) = '[' THEN b."images"::jsonb
      ELSE to_jsonb(string_to_array(b."images", ','))
    END
  ) WITH ORDINALITY AS img(value, ordinality)
)
INSERT INTO "blog_image" ("blog_id", "file_id", "sort_order")
SELECT
  expanded.blog_id,
  CONCAT('legacy-blog-content-', md5(expanded.url)) AS file_id,
  expanded.sort_order
FROM expanded
WHERE expanded.url <> ''
ON CONFLICT ("blog_id", "file_id") DO NOTHING;
--> statement-breakpoint
UPDATE "blog"
SET "hero_image_id" = CONCAT('legacy-blog-hero-', md5("hero_image"))
WHERE "hero_image" IS NOT NULL
  AND btrim("hero_image") <> '';
--> statement-breakpoint
UPDATE "blog"
SET "featured_image_id" = CONCAT('legacy-blog-featured-', md5("featured_image"))
WHERE "featured_image" IS NOT NULL
  AND btrim("featured_image") <> '';
--> statement-breakpoint
UPDATE "blog"
SET "category_id" = "category"::text
WHERE "category" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "blog" DROP CONSTRAINT IF EXISTS "blog_post_author_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_hero_image_id_file_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_featured_image_id_file_id_fk" FOREIGN KEY ("featured_image_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog" ADD CONSTRAINT "blog_category_id_blog_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."blog_category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_image" ADD CONSTRAINT "blog_image_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_image" ADD CONSTRAINT "blog_image_file_id_file_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."file"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_blog_id_blog_id_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "blog_comment" ADD CONSTRAINT "blog_comment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "blog_category_id_idx" ON "blog" USING btree ("category_id");
--> statement-breakpoint
CREATE INDEX "blog_author_id_idx" ON "blog" USING btree ("author_id");
--> statement-breakpoint
CREATE INDEX "blog_status_idx" ON "blog" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "blog_featured_idx" ON "blog" USING btree ("featured");
--> statement-breakpoint
CREATE INDEX "blog_published_at_idx" ON "blog" USING btree ("published_at");
--> statement-breakpoint
CREATE INDEX "blog_created_at_idx" ON "blog" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "blog_hero_image_id_idx" ON "blog" USING btree ("hero_image_id");
--> statement-breakpoint
CREATE INDEX "blog_featured_image_id_idx" ON "blog" USING btree ("featured_image_id");
--> statement-breakpoint
ALTER TABLE "blog"
  DROP COLUMN "hero_image",
  DROP COLUMN "featured_image",
  DROP COLUMN "images",
  DROP COLUMN "category",
  DROP COLUMN "comment_count",
  DROP COLUMN "reading_level",
  DROP COLUMN "target_audience";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."reading_level";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."target_audience";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."blog_category_enum";

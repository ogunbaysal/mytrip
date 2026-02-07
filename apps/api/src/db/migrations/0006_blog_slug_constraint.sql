DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'blog_post_slug_unique'
      AND conrelid = 'public.blog'::regclass
  ) THEN
    ALTER TABLE "blog" RENAME CONSTRAINT "blog_post_slug_unique" TO "blog_slug_unique";
  END IF;
END $$;

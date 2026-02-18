ALTER TABLE "place"
ALTER COLUMN "category_id" SET DATA TYPE "place_kind"
USING CASE
  WHEN "category_id" IS NULL THEN NULL
  ELSE "category_id"::"place_kind"
END;

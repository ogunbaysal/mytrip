ALTER TABLE "place" DROP CONSTRAINT IF EXISTS "place_category_id_place_kind_meta_id_fk";

ALTER TABLE "place_kind_meta"
ALTER COLUMN "id" SET DATA TYPE "place_kind"
USING "id"::"place_kind";

ALTER TABLE "place"
ALTER COLUMN "category_id" SET DATA TYPE "place_kind"
USING CASE
  WHEN "category_id" IS NULL THEN NULL
  ELSE "category_id"::"place_kind"
END;

ALTER TABLE "place"
ADD CONSTRAINT "place_category_id_place_kind_meta_id_fk"
FOREIGN KEY ("category_id")
REFERENCES "public"."place_kind_meta"("id")
ON DELETE set null
ON UPDATE no action;

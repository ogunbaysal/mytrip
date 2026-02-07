ALTER TYPE "public"."file_usage" ADD VALUE 'business_document' BEFORE 'profile_avatar';--> statement-breakpoint
ALTER TABLE "place" ADD COLUMN "business_document_file_id" text;--> statement-breakpoint
ALTER TABLE "place" ADD CONSTRAINT "place_business_document_file_id_file_id_fk" FOREIGN KEY ("business_document_file_id") REFERENCES "public"."file"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "place_business_document_file_id_idx" ON "place" USING btree ("business_document_file_id");
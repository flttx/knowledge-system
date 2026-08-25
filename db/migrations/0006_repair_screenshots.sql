CREATE TABLE IF NOT EXISTS "screenshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"attachment_id" uuid NOT NULL,
	"source_id" uuid,
	"note_id" uuid,
	"page" text,
	"location" text,
	"annotation" text,
	"extracted_text" text,
	"status" "inbox_status" DEFAULT 'inbox' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'screenshots_user_id_users_id_fk') THEN
		ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'screenshots_attachment_id_attachments_id_fk') THEN
		ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_attachment_id_attachments_id_fk" FOREIGN KEY ("attachment_id") REFERENCES "public"."attachments"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'screenshots_source_id_sources_id_fk') THEN
		ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;
	END IF;
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'screenshots_note_id_notes_id_fk') THEN
		ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "screenshots_user_status_created_idx" ON "screenshots" USING btree ("user_id", "status", "created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "screenshots_user_source_idx" ON "screenshots" USING btree ("user_id", "source_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "screenshots_user_note_idx" ON "screenshots" USING btree ("user_id", "note_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "screenshots_user_attachment_idx" ON "screenshots" USING btree ("user_id", "attachment_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "screenshots_annotation_trgm_idx" ON "screenshots" USING gin ("annotation" gin_trgm_ops) WHERE "screenshots"."archived_at" is null;

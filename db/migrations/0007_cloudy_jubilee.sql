ALTER TABLE "highlights" ADD COLUMN "note_id" uuid;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD COLUMN "note_id" uuid;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "highlights_user_note_idx" ON "highlights" USING btree ("user_id","note_id");--> statement-breakpoint
CREATE INDEX "quick_notes_user_note_idx" ON "quick_notes" USING btree ("user_id","note_id");
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX "highlights_text_trgm_idx" ON "highlights" USING gin ("text" gin_trgm_ops) WHERE "highlights"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "highlights_comment_trgm_idx" ON "highlights" USING gin ("personal_comment" gin_trgm_ops) WHERE "highlights"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "notes_title_trgm_idx" ON "notes" USING gin ("title" gin_trgm_ops) WHERE "notes"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "notes_content_trgm_idx" ON "notes" USING gin ("content_markdown" gin_trgm_ops) WHERE "notes"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "sources_title_trgm_idx" ON "sources" USING gin ("title" gin_trgm_ops) WHERE "sources"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "sources_publication_trgm_idx" ON "sources" USING gin ("publication" gin_trgm_ops) WHERE "sources"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "sources_author_trgm_idx" ON "sources" USING gin ("author" gin_trgm_ops) WHERE "sources"."archived_at" is null;

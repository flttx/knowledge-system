CREATE TYPE "public"."ai_suggestion_status" AS ENUM('pending', 'accepted', 'rejected', 'ignored', 'expired');--> statement-breakpoint
CREATE TYPE "public"."ai_suggestion_type" AS ENUM('inbox_group', 'durable_note', 'tags', 'relation', 'summary');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('inbox', 'processed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."relation_status" AS ENUM('confirmed', 'suggested', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."relation_type" AS ENUM('wikilink', 'manual', 'ai_suggested', 'semantic');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('article', 'magazine', 'pdf', 'book', 'web', 'other');--> statement-breakpoint
CREATE TABLE "ai_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"suggestion_type" "ai_suggestion_type" NOT NULL,
	"source_object_type" text NOT NULL,
	"source_object_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"input_hash" text,
	"prompt_version" text,
	"status" "ai_suggestion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"file_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"source_id" uuid,
	"note_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_id" uuid,
	"text" text NOT NULL,
	"page" integer,
	"location" text,
	"personal_comment" text,
	"status" "inbox_status" DEFAULT 'inbox' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlights_text_not_blank" CHECK (length(btrim("highlights"."text")) > 0)
);
--> statement-breakpoint
CREATE TABLE "note_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_note_id" uuid NOT NULL,
	"target_note_id" uuid NOT NULL,
	"relation_type" "relation_type" NOT NULL,
	"status" "relation_status" NOT NULL,
	"confidence" numeric,
	"reason" text,
	"origin_key" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "note_relations_no_self_relation" CHECK ("note_relations"."source_note_id" <> "note_relations"."target_note_id")
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"note_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "note_tags_note_id_tag_id_pk" PRIMARY KEY("note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content_markdown" text DEFAULT '' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quick_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"source_id" uuid,
	"content" text NOT NULL,
	"status" "inbox_status" DEFAULT 'inbox' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quick_notes_content_not_blank" CHECK (length(btrim("quick_notes"."content")) > 0)
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"publication" text,
	"author" text,
	"issue" text,
	"source_type" "source_type" NOT NULL,
	"url" text,
	"file_url" text,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"normalized_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_suggestions" ADD CONSTRAINT "ai_suggestions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "highlights" ADD CONSTRAINT "highlights_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_relations" ADD CONSTRAINT "note_relations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_relations" ADD CONSTRAINT "note_relations_source_note_id_notes_id_fk" FOREIGN KEY ("source_note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_relations" ADD CONSTRAINT "note_relations_target_note_id_notes_id_fk" FOREIGN KEY ("target_note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quick_notes" ADD CONSTRAINT "quick_notes_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_suggestions_user_status_created_idx" ON "ai_suggestions" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "ai_suggestions_source_object_idx" ON "ai_suggestions" USING btree ("user_id","source_object_type","source_object_id");--> statement-breakpoint
CREATE INDEX "attachments_user_created_idx" ON "attachments" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "attachments_user_source_idx" ON "attachments" USING btree ("user_id","source_id");--> statement-breakpoint
CREATE INDEX "attachments_user_note_idx" ON "attachments" USING btree ("user_id","note_id");--> statement-breakpoint
CREATE INDEX "highlights_user_status_created_idx" ON "highlights" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "highlights_user_source_idx" ON "highlights" USING btree ("user_id","source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "note_relations_origin_unique" ON "note_relations" USING btree ("user_id","source_note_id","target_note_id","relation_type","origin_key");--> statement-breakpoint
CREATE INDEX "note_relations_user_source_idx" ON "note_relations" USING btree ("user_id","source_note_id");--> statement-breakpoint
CREATE INDEX "note_relations_user_target_idx" ON "note_relations" USING btree ("user_id","target_note_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_user_slug_unique" ON "notes" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "notes_user_updated_idx" ON "notes" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "notes_user_title_idx" ON "notes" USING btree ("user_id","title");--> statement-breakpoint
CREATE INDEX "quick_notes_user_status_created_idx" ON "quick_notes" USING btree ("user_id","status","created_at");--> statement-breakpoint
CREATE INDEX "quick_notes_user_source_idx" ON "quick_notes" USING btree ("user_id","source_id");--> statement-breakpoint
CREATE INDEX "sources_user_created_idx" ON "sources" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "sources_user_title_idx" ON "sources" USING btree ("user_id","title");--> statement-breakpoint
CREATE INDEX "sources_user_type_idx" ON "sources" USING btree ("user_id","source_type");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_normalized_name_unique" ON "tags" USING btree ("user_id","normalized_name");
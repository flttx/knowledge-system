import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const sourceTypeEnum = pgEnum("source_type", [
  "article",
  "magazine",
  "pdf",
  "book",
  "web",
  "other",
]);

export const inboxStatusEnum = pgEnum("inbox_status", [
  "inbox",
  "processed",
  "archived",
]);

export const relationTypeEnum = pgEnum("relation_type", [
  "wikilink",
  "manual",
  "ai_suggested",
  "semantic",
]);

export const relationStatusEnum = pgEnum("relation_status", [
  "confirmed",
  "suggested",
  "rejected",
]);

export const aiSuggestionTypeEnum = pgEnum("ai_suggestion_type", [
  "inbox_group",
  "durable_note",
  "tags",
  "relation",
  "summary",
]);

export const aiSuggestionStatusEnum = pgEnum("ai_suggestion_status", [
  "pending",
  "accepted",
  "rejected",
  "ignored",
  "expired",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "disabled"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username"),
  passwordHash: text("password_hash"),
  status: userStatusEnum("status").notNull().default("active"),
  email: text("email").unique(),
  displayName: text("display_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => [
  uniqueIndex("users_username_unique").on(table.username),
]);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_idx").on(table.expiresAt),
  ],
);

export const localAgentTokens = pgTable(
  "local_agent_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("local_agent_tokens_user_idx").on(table.userId),
    index("local_agent_tokens_expiry_idx").on(table.expiresAt),
  ],
);

export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    publication: text("publication"),
    author: text("author"),
    issue: text("issue"),
    sourceType: sourceTypeEnum("source_type").notNull(),
    url: text("url"),
    fileUrl: text("file_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("sources_user_created_idx").on(table.userId, table.createdAt),
    index("sources_user_title_idx").on(table.userId, table.title),
    index("sources_user_type_idx").on(table.userId, table.sourceType),
    index("sources_title_trgm_idx")
      .using("gin", sql`${table.title} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
    index("sources_publication_trgm_idx")
      .using("gin", sql`${table.publication} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
    index("sources_author_trgm_idx")
      .using("gin", sql`${table.author} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
  ],
);

export const highlights = pgTable(
  "highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    text: text("text").notNull(),
    page: integer("page"),
    location: text("location"),
    personalComment: text("personal_comment"),
    status: inboxStatusEnum("status").notNull().default("inbox"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("highlights_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    index("highlights_user_source_idx").on(table.userId, table.sourceId),
    index("highlights_text_trgm_idx")
      .using("gin", sql`${table.text} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
    index("highlights_comment_trgm_idx")
      .using("gin", sql`${table.personalComment} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
    check("highlights_text_not_blank", sql`length(btrim(${table.text})) > 0`),
  ],
);

export const quickNotes = pgTable(
  "quick_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    content: text("content").notNull(),
    status: inboxStatusEnum("status").notNull().default("inbox"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("quick_notes_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    index("quick_notes_user_source_idx").on(table.userId, table.sourceId),
    check(
      "quick_notes_content_not_blank",
      sql`length(btrim(${table.content})) > 0`,
    ),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    contentMarkdown: text("content_markdown").notNull().default(""),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("notes_user_slug_unique").on(table.userId, table.slug),
    index("notes_user_updated_idx").on(table.userId, table.updatedAt),
    index("notes_user_title_idx").on(table.userId, table.title),
    index("notes_title_trgm_idx")
      .using("gin", sql`${table.title} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
    index("notes_content_trgm_idx")
      .using("gin", sql`${table.contentMarkdown} gin_trgm_ops`)
      .where(sql`${table.archivedAt} is null`),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("tags_user_normalized_name_unique").on(
      table.userId,
      table.normalizedName,
    ),
  ],
);

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.noteId, table.tagId] })],
);

export const noteRelations = pgTable(
  "note_relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sourceNoteId: uuid("source_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    targetNoteId: uuid("target_note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    relationType: relationTypeEnum("relation_type").notNull(),
    status: relationStatusEnum("status").notNull(),
    confidence: numeric("confidence"),
    reason: text("reason"),
    originKey: text("origin_key").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("note_relations_origin_unique").on(
      table.userId,
      table.sourceNoteId,
      table.targetNoteId,
      table.relationType,
      table.originKey,
    ),
    index("note_relations_user_source_idx").on(
      table.userId,
      table.sourceNoteId,
    ),
    index("note_relations_user_target_idx").on(
      table.userId,
      table.targetNoteId,
    ),
    check(
      "note_relations_no_self_relation",
      sql`${table.sourceNoteId} <> ${table.targetNoteId}`,
    ),
  ],
);

export const aiSuggestions = pgTable(
  "ai_suggestions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    suggestionType: aiSuggestionTypeEnum("suggestion_type").notNull(),
    sourceObjectType: text("source_object_type").notNull(),
    sourceObjectId: uuid("source_object_id").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    inputHash: text("input_hash"),
    promptVersion: text("prompt_version"),
    status: aiSuggestionStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("ai_suggestions_user_status_created_idx").on(
      table.userId,
      table.status,
      table.createdAt,
    ),
    index("ai_suggestions_source_object_idx").on(
      table.userId,
      table.sourceObjectType,
      table.sourceObjectId,
    ),
    uniqueIndex("ai_suggestions_user_input_hash_unique").on(
      table.userId,
      table.inputHash,
    ),
  ],
);

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storageKey: text("storage_key").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    sourceId: uuid("source_id").references(() => sources.id, {
      onDelete: "set null",
    }),
    noteId: uuid("note_id").references(() => notes.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("attachments_user_created_idx").on(table.userId, table.createdAt),
    index("attachments_user_source_idx").on(table.userId, table.sourceId),
    index("attachments_user_note_idx").on(table.userId, table.noteId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
export type Highlight = typeof highlights.$inferSelect;
export type NewHighlight = typeof highlights.$inferInsert;
export type QuickNote = typeof quickNotes.$inferSelect;
export type NewQuickNote = typeof quickNotes.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type NoteTag = typeof noteTags.$inferSelect;
export type NewNoteTag = typeof noteTags.$inferInsert;
export type NoteRelation = typeof noteRelations.$inferSelect;
export type NewNoteRelation = typeof noteRelations.$inferInsert;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type NewAiSuggestion = typeof aiSuggestions.$inferInsert;
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

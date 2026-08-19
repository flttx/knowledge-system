import { and, desc, eq, isNull, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { quickNotes, sources } from "@/db/schema";
import { NotFoundError } from "@/lib/services/errors";
import {
  afterCursor,
  decodeCursor,
  encodeCursor,
  getLimit,
} from "@/lib/services/pagination";
import {
  createQuickNoteSchema,
  parseSchema,
  updateQuickNoteSchema,
  type InboxStatus,
} from "@/lib/services/validation";

export interface ListQuickNotesOptions {
  cursor?: string;
  limit?: number;
  status?: InboxStatus;
  sourceId?: string;
}

export interface QuickNoteItem {
  id: string;
  sourceId: string | null;
  sourceTitle: string | null;
  content: string;
  status: InboxStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface QuickNotePage {
  items: QuickNoteItem[];
  nextCursor: string | null;
}

function quickNoteScope(userId: string, quickNoteId: string) {
  return and(eq(quickNotes.id, quickNoteId), eq(quickNotes.userId, userId));
}

async function requireOwnedSource(userId: string, sourceId: string): Promise<void> {
  const db = getDb();
  const [source] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.userId, userId)))
    .limit(1);

  if (!source) {
    throw new NotFoundError("找不到请求的来源。");
  }
}

export async function createQuickNote(
  userId: string,
  input: unknown,
): Promise<QuickNoteItem> {
  const values = parseSchema(createQuickNoteSchema, input);
  if (values.sourceId) {
    await requireOwnedSource(userId, values.sourceId);
  }

  const db = getDb();
  const [quickNote] = await db
    .insert(quickNotes)
    .values({
      userId,
      sourceId: values.sourceId ?? null,
      content: values.content,
      status: values.status ?? "inbox",
      archivedAt: values.status === "archived" ? new Date() : null,
    })
    .returning();

  if (!quickNote) {
    throw new Error("快速笔记创建失败。");
  }

  return toQuickNoteItem(quickNote, null);
}

function toQuickNoteItem(
  quickNote: typeof quickNotes.$inferSelect,
  sourceTitle: string | null,
): QuickNoteItem {
  return {
    ...quickNote,
    status: quickNote.status as InboxStatus,
    sourceTitle,
  };
}

export async function listQuickNotes(
  userId: string,
  options: ListQuickNotesOptions = {},
): Promise<QuickNotePage> {
  const limit = getLimit(options.limit);
  const cursor = decodeCursor(options.cursor);
  const conditions = [eq(quickNotes.userId, userId)];

  if (options.status) {
    conditions.push(eq(quickNotes.status, options.status));
  } else {
    conditions.push(ne(quickNotes.status, "archived"));
    conditions.push(isNull(quickNotes.archivedAt));
  }
  if (options.sourceId) {
    conditions.push(eq(quickNotes.sourceId, options.sourceId));
  }

  const cursorCondition = afterCursor(quickNotes.createdAt, quickNotes.id, cursor);
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const db = getDb();
  const rows = await db
    .select({ quickNote: quickNotes, sourceTitle: sources.title })
    .from(quickNotes)
    .leftJoin(
      sources,
      and(eq(quickNotes.sourceId, sources.id), eq(sources.userId, userId)),
    )
    .where(and(...conditions))
    .orderBy(desc(quickNotes.createdAt), desc(quickNotes.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = rows
    .slice(0, limit)
    .map((row) => toQuickNoteItem(row.quickNote, row.sourceTitle));
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasNext && last ? encodeCursor(last) : null,
  };
}

export async function getQuickNote(
  userId: string,
  quickNoteId: string,
): Promise<QuickNoteItem> {
  const db = getDb();
  const [row] = await db
    .select({ quickNote: quickNotes, sourceTitle: sources.title })
    .from(quickNotes)
    .leftJoin(
      sources,
      and(eq(quickNotes.sourceId, sources.id), eq(sources.userId, userId)),
    )
    .where(quickNoteScope(userId, quickNoteId))
    .limit(1);

  if (!row) {
    throw new NotFoundError("找不到请求的快速笔记。");
  }

  return toQuickNoteItem(row.quickNote, row.sourceTitle);
}

export async function updateQuickNote(
  userId: string,
  quickNoteId: string,
  input: unknown,
): Promise<QuickNoteItem> {
  const values = parseSchema(updateQuickNoteSchema, input);
  await getQuickNote(userId, quickNoteId);

  if (values.sourceId) {
    await requireOwnedSource(userId, values.sourceId);
  }

  const update: Partial<typeof quickNotes.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (values.content !== undefined) update.content = values.content;
  if (values.sourceId !== undefined) update.sourceId = values.sourceId;
  if (values.status !== undefined) {
    update.status = values.status;
    update.archivedAt = values.status === "archived" ? new Date() : null;
  }

  const db = getDb();
  await db.update(quickNotes).set(update).where(quickNoteScope(userId, quickNoteId));

  return getQuickNote(userId, quickNoteId);
}

export async function archiveQuickNote(
  userId: string,
  quickNoteId: string,
): Promise<QuickNoteItem> {
  await getQuickNote(userId, quickNoteId);
  const db = getDb();
  await db
    .update(quickNotes)
    .set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
    .where(quickNoteScope(userId, quickNoteId));

  return getQuickNote(userId, quickNoteId);
}

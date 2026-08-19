import {
  and,
  desc,
  eq,
  isNull,
  ne,
} from "drizzle-orm";

import { getDb } from "@/db";
import { highlights, sources } from "@/db/schema";
import { NotFoundError } from "@/lib/services/errors";
import {
  afterCursor,
  decodeCursor,
  encodeCursor,
  getLimit,
} from "@/lib/services/pagination";
import {
  createHighlightSchema,
  parseSchema,
  updateHighlightSchema,
  type InboxStatus,
} from "@/lib/services/validation";

export interface ListHighlightsOptions {
  cursor?: string;
  limit?: number;
  status?: InboxStatus;
  sourceId?: string;
}

export interface HighlightItem {
  id: string;
  sourceId: string | null;
  sourceTitle: string | null;
  text: string;
  page: number | null;
  location: string | null;
  personalComment: string | null;
  status: InboxStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface HighlightPage {
  items: HighlightItem[];
  nextCursor: string | null;
}

function highlightScope(userId: string, highlightId: string) {
  return and(eq(highlights.id, highlightId), eq(highlights.userId, userId));
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

export async function createHighlight(
  userId: string,
  input: unknown,
): Promise<HighlightItem> {
  const values = parseSchema(createHighlightSchema, input);
  if (values.sourceId) {
    await requireOwnedSource(userId, values.sourceId);
  }

  const db = getDb();
  const [highlight] = await db
    .insert(highlights)
    .values({
      userId,
      sourceId: values.sourceId ?? null,
      text: values.text,
      page: values.page ?? null,
      location: values.location ?? null,
      personalComment: values.personalComment ?? null,
      status: values.status ?? "inbox",
      archivedAt: values.status === "archived" ? new Date() : null,
    })
    .returning();

  if (!highlight) {
    throw new Error("高亮创建失败。");
  }

  return toHighlightItem(highlight, null);
}

function toHighlightItem(
  highlight: typeof highlights.$inferSelect,
  sourceTitle: string | null,
): HighlightItem {
  return {
    ...highlight,
    status: highlight.status as InboxStatus,
    sourceTitle,
  };
}

export async function listHighlights(
  userId: string,
  options: ListHighlightsOptions = {},
): Promise<HighlightPage> {
  const limit = getLimit(options.limit);
  const cursor = decodeCursor(options.cursor);
  const conditions = [eq(highlights.userId, userId)];

  if (options.status) {
    conditions.push(eq(highlights.status, options.status));
  } else {
    conditions.push(ne(highlights.status, "archived"));
    conditions.push(isNull(highlights.archivedAt));
  }
  if (options.sourceId) {
    conditions.push(eq(highlights.sourceId, options.sourceId));
  }

  const cursorCondition = afterCursor(highlights.createdAt, highlights.id, cursor);
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const db = getDb();
  const rows = await db
    .select({
      highlight: highlights,
      sourceTitle: sources.title,
    })
    .from(highlights)
    .leftJoin(
      sources,
      and(eq(highlights.sourceId, sources.id), eq(sources.userId, userId)),
    )
    .where(and(...conditions))
    .orderBy(desc(highlights.createdAt), desc(highlights.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = rows
    .slice(0, limit)
    .map((row) => toHighlightItem(row.highlight, row.sourceTitle));
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasNext && last ? encodeCursor(last) : null,
  };
}

export async function getHighlight(
  userId: string,
  highlightId: string,
): Promise<HighlightItem> {
  const db = getDb();
  const [row] = await db
    .select({ highlight: highlights, sourceTitle: sources.title })
    .from(highlights)
    .leftJoin(
      sources,
      and(eq(highlights.sourceId, sources.id), eq(sources.userId, userId)),
    )
    .where(highlightScope(userId, highlightId))
    .limit(1);

  if (!row) {
    throw new NotFoundError("找不到请求的高亮。");
  }

  return toHighlightItem(row.highlight, row.sourceTitle);
}

export async function updateHighlight(
  userId: string,
  highlightId: string,
  input: unknown,
): Promise<HighlightItem> {
  const values = parseSchema(updateHighlightSchema, input);
  const current = await getHighlight(userId, highlightId);

  if (values.sourceId) {
    await requireOwnedSource(userId, values.sourceId);
  }

  const update: Partial<typeof highlights.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (values.text !== undefined) update.text = values.text;
  if (values.sourceId !== undefined) update.sourceId = values.sourceId;
  if (values.page !== undefined) update.page = values.page;
  if (values.location !== undefined) update.location = values.location;
  if (values.personalComment !== undefined) {
    update.personalComment = values.personalComment;
  }
  if (values.status !== undefined) {
    update.status = values.status;
    update.archivedAt = values.status === "archived" ? new Date() : null;
  }

  const db = getDb();
  await db.update(highlights).set(update).where(highlightScope(userId, highlightId));

  if (Object.keys(update).length === 1 && current) {
    return current;
  }

  return getHighlight(userId, highlightId);
}

export async function archiveHighlight(
  userId: string,
  highlightId: string,
): Promise<HighlightItem> {
  await getHighlight(userId, highlightId);
  const db = getDb();
  await db
    .update(highlights)
    .set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() })
    .where(highlightScope(userId, highlightId));

  return getHighlight(userId, highlightId);
}

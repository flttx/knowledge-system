import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
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
  createSourceSchema,
  parseSchema,
  updateSourceSchema,
  type SourceType,
} from "@/lib/services/validation";

export interface ListSourcesOptions {
  cursor?: string;
  limit?: number;
  sourceType?: SourceType;
  publication?: string;
  archived?: boolean;
  q?: string;
}

export interface SourceSummary {
  id: string;
  title: string;
  publication: string | null;
  sourceType: SourceType;
  publishedAt: Date | null;
  highlightCount: number;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface SourceDetail extends SourceSummary {
  author: string | null;
  issue: string | null;
  url: string | null;
  fileUrl: string | null;
}

export interface SourcePage {
  items: SourceSummary[];
  nextCursor: string | null;
}

function sourceScope(userId: string, sourceId: string) {
  return and(eq(sources.id, sourceId), eq(sources.userId, userId));
}

async function requireOwnedSource(userId: string, sourceId: string): Promise<void> {
  const db = getDb();
  const [source] = await db
    .select({ id: sources.id })
    .from(sources)
    .where(sourceScope(userId, sourceId))
    .limit(1);

  if (!source) {
    throw new NotFoundError("找不到请求的来源。");
  }
}

export async function createSource(
  userId: string,
  input: unknown,
): Promise<SourceDetail> {
  const values = parseSchema(createSourceSchema, input);
  const db = getDb();
  const [source] = await db
    .insert(sources)
    .values({
      userId,
      title: values.title,
      publication: values.publication ?? null,
      author: values.author ?? null,
      issue: values.issue ?? null,
      sourceType: values.sourceType,
      url: values.url ?? null,
      publishedAt: values.publishedAt ?? null,
    })
    .returning();

  if (!source) {
    throw new Error("来源创建失败。");
  }

  return { ...source, highlightCount: 0 };
}

export async function listSources(
  userId: string,
  options: ListSourcesOptions = {},
): Promise<SourcePage> {
  const limit = getLimit(options.limit);
  const cursor = decodeCursor(options.cursor);
  const conditions = [eq(sources.userId, userId)];

  if (options.archived !== true) {
    conditions.push(isNull(sources.archivedAt));
  }
  if (options.sourceType) {
    conditions.push(eq(sources.sourceType, options.sourceType));
  }
  if (options.publication) {
    conditions.push(ilike(sources.publication, `%${options.publication}%`));
  }
  if (options.q) {
    const pattern = `%${options.q}%`;
    conditions.push(
      or(
        ilike(sources.title, pattern),
        ilike(sources.publication, pattern),
        ilike(sources.author, pattern),
      ) ?? eq(sources.title, options.q),
    );
  }

  const cursorCondition = afterCursor(sources.createdAt, sources.id, cursor);
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const db = getDb();
  const rows = await db
    .select({
      id: sources.id,
      title: sources.title,
      publication: sources.publication,
      sourceType: sources.sourceType,
      publishedAt: sources.publishedAt,
      createdAt: sources.createdAt,
      updatedAt: sources.updatedAt,
      archivedAt: sources.archivedAt,
      highlightCount: count(highlights.id),
    })
    .from(sources)
    .leftJoin(
      highlights,
      and(
        eq(highlights.sourceId, sources.id),
        eq(highlights.userId, userId),
      ),
    )
    .where(and(...conditions))
    .groupBy(sources.id)
    .orderBy(desc(sources.createdAt), desc(sources.id))
    .limit(limit + 1);

  const hasNext = rows.length > limit;
  const items = rows.slice(0, limit).map((row) => ({
    ...row,
    sourceType: row.sourceType as SourceType,
    highlightCount: Number(row.highlightCount),
  }));
  const last = items.at(-1);

  return {
    items,
    nextCursor: hasNext && last ? encodeCursor(last) : null,
  };
}

export async function getSource(
  userId: string,
  sourceId: string,
): Promise<SourceDetail> {
  const db = getDb();
  const [source] = await db
    .select({
      id: sources.id,
      title: sources.title,
      publication: sources.publication,
      author: sources.author,
      issue: sources.issue,
      sourceType: sources.sourceType,
      url: sources.url,
      fileUrl: sources.fileUrl,
      publishedAt: sources.publishedAt,
      createdAt: sources.createdAt,
      updatedAt: sources.updatedAt,
      archivedAt: sources.archivedAt,
      highlightCount: count(highlights.id),
    })
    .from(sources)
    .leftJoin(
      highlights,
      and(
        eq(highlights.sourceId, sources.id),
        eq(highlights.userId, userId),
      ),
    )
    .where(sourceScope(userId, sourceId))
    .groupBy(sources.id)
    .limit(1);

  if (!source) {
    throw new NotFoundError("找不到请求的来源。");
  }

  return {
    ...source,
    sourceType: source.sourceType as SourceType,
    highlightCount: Number(source.highlightCount),
  };
}

export async function updateSource(
  userId: string,
  sourceId: string,
  input: unknown,
): Promise<SourceDetail> {
  const values = parseSchema(updateSourceSchema, input);
  await requireOwnedSource(userId, sourceId);
  const update: Partial<typeof sources.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (values.title !== undefined) update.title = values.title;
  if (values.publication !== undefined) update.publication = values.publication;
  if (values.author !== undefined) update.author = values.author;
  if (values.issue !== undefined) update.issue = values.issue;
  if (values.sourceType !== undefined) update.sourceType = values.sourceType;
  if (values.url !== undefined) update.url = values.url;
  if (values.publishedAt !== undefined) update.publishedAt = values.publishedAt;

  const db = getDb();
  await db
    .update(sources)
    .set(update)
    .where(sourceScope(userId, sourceId));

  return getSource(userId, sourceId);
}

export async function archiveSource(
  userId: string,
  sourceId: string,
): Promise<SourceDetail> {
  await requireOwnedSource(userId, sourceId);
  const db = getDb();
  await db
    .update(sources)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(sourceScope(userId, sourceId));

  return getSource(userId, sourceId);
}

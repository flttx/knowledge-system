import {
  and,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  isNotNull,
  or,
} from "drizzle-orm";

import { getDb } from "@/db";
import { noteTags, notes, tags } from "@/db/schema";
import { NotFoundError } from "@/lib/services/errors";
import {
  afterCursor,
  decodeCursor,
  encodeCursor,
  getLimit,
} from "@/lib/services/pagination";
import { makeExcerpt, normalizeTagName, slugFromTitle } from "@/lib/notes/normalization";
import { synchronizeWikilinkRelations } from "@/lib/services/wikilink-service";
import {
  createNoteSchema,
  createTagSchema,
  parseSchema,
  updateNoteSchema,
} from "@/lib/services/validation";

export interface NoteTagValue {
  id: string;
  name: string;
}

export interface NoteSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: NoteTagValue[];
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface NoteDetail extends NoteSummary {
  contentMarkdown: string;
  createdAt: Date;
}

export interface NotePage {
  items: NoteSummary[];
  nextCursor: string | null;
}

export interface TagSummary {
  id: string;
  name: string;
  noteCount: number;
}

export interface ListNotesOptions {
  cursor?: string;
  limit?: number;
  tag?: string;
  archived?: boolean;
  q?: string;
}

export interface ListTagsOptions {
  q?: string;
  limit?: number;
}

type Database = ReturnType<typeof getDb>;
type Transaction = Parameters<Database["transaction"]>[0] extends (
  transaction: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;
type DbExecutor = Database | Transaction;
export type NoteDbExecutor = DbExecutor;

export interface CreateNoteValues {
  title: string;
  contentMarkdown: string;
  tagNames: string[];
}

function noteScope(userId: string, noteId: string) {
  return and(eq(notes.id, noteId), eq(notes.userId, userId));
}

async function requireOwnedNote(
  db: DbExecutor,
  userId: string,
  noteId: string,
) {
  const [note] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(noteScope(userId, noteId))
    .limit(1);

  if (!note) {
    throw new NotFoundError("找不到请求的笔记。");
  }
}

async function uniqueSlug(
  db: DbExecutor,
  userId: string,
  title: string,
): Promise<string> {
  const base = slugFromTitle(title);
  let candidate = base;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: notes.id })
      .from(notes)
      .where(and(eq(notes.userId, userId), eq(notes.slug, candidate)))
      .limit(1);
    if (!existing) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function getTagValues(
  db: DbExecutor,
  userId: string,
  noteIds: string[],
): Promise<Map<string, NoteTagValue[]>> {
  const result = new Map<string, NoteTagValue[]>();
  if (noteIds.length === 0) {
    return result;
  }

  const rows = await db
    .select({
      noteId: noteTags.noteId,
      id: tags.id,
      name: tags.name,
    })
    .from(noteTags)
    .innerJoin(
      tags,
      and(eq(noteTags.tagId, tags.id), eq(tags.userId, userId)),
    )
    .where(inArray(noteTags.noteId, noteIds));

  for (const row of rows) {
    const values = result.get(row.noteId) ?? [];
    values.push({ id: row.id, name: row.name });
    result.set(row.noteId, values);
  }

  return result;
}

export async function replaceNoteTags(
  db: DbExecutor,
  userId: string,
  noteId: string,
  tagNames: string[],
): Promise<void> {
  const normalizedNames = new Map<string, string>();
  for (const tagName of tagNames) {
    const displayName = tagName.trim();
    const normalizedName = normalizeTagName(displayName);
    if (normalizedName) {
      normalizedNames.set(normalizedName, displayName);
    }
  }

  const tagIds: string[] = [];
  for (const [normalizedName, name] of normalizedNames) {
    const [inserted] = await db
      .insert(tags)
      .values({ userId, name, normalizedName })
      .onConflictDoNothing({ target: [tags.userId, tags.normalizedName] })
      .returning({ id: tags.id });

    if (inserted) {
      tagIds.push(inserted.id);
      continue;
    }

    const [existing] = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.normalizedName, normalizedName)))
      .limit(1);
    if (existing) {
      tagIds.push(existing.id);
    }
  }

  await db.delete(noteTags).where(eq(noteTags.noteId, noteId));
  if (tagIds.length > 0) {
    await db
      .insert(noteTags)
      .values(tagIds.map((tagId) => ({ noteId, tagId })))
      .onConflictDoNothing();
  }
}

function toNoteSummary(
  note: typeof notes.$inferSelect,
  noteTagValues: NoteTagValue[],
): NoteSummary {
  return {
    id: note.id,
    title: note.title,
    slug: note.slug,
    excerpt: makeExcerpt(note.contentMarkdown),
    tags: noteTagValues,
    updatedAt: note.updatedAt,
    archivedAt: note.archivedAt,
  };
}

export async function createNote(userId: string, input: unknown): Promise<NoteDetail> {
  const values = parseSchema(createNoteSchema, input);
  const db = getDb();
  const note = await db.transaction(async (tx) => {
    const slug = await uniqueSlug(tx, userId, values.title);
    const [created] = await tx
      .insert(notes)
      .values({
        userId,
        title: values.title,
        slug,
        contentMarkdown: values.contentMarkdown,
      })
      .returning();
    if (!created) {
      throw new Error("笔记创建失败。");
    }

    await synchronizeWikilinkRelations(
      tx,
      userId,
      created.id,
      values.contentMarkdown,
    );
    if (values.tagNames) {
      await replaceNoteTags(tx, userId, created.id, values.tagNames);
    }
    return created;
  });

  return getNote(userId, note.id);
}

export async function createNoteInTransaction(
  db: NoteDbExecutor,
  userId: string,
  values: CreateNoteValues,
): Promise<typeof notes.$inferSelect> {
  const slug = await uniqueSlug(db, userId, values.title);
  const [created] = await db
    .insert(notes)
    .values({
      userId,
      title: values.title,
      slug,
      contentMarkdown: values.contentMarkdown,
    })
    .returning();
  if (!created) {
    throw new Error("Note creation failed.");
  }

  await synchronizeWikilinkRelations(
    db,
    userId,
    created.id,
    values.contentMarkdown,
  );
  await replaceNoteTags(db, userId, created.id, values.tagNames);
  return created;
}

export async function listNotes(
  userId: string,
  options: ListNotesOptions = {},
): Promise<NotePage> {
  const db = getDb();
  const limit = getLimit(options.limit);
  const cursor = decodeCursor(options.cursor);
  const conditions = [eq(notes.userId, userId)];

  conditions.push(
    options.archived === true ? isNotNull(notes.archivedAt) : isNull(notes.archivedAt),
  );

  if (options.q) {
    const pattern = `%${options.q}%`;
    conditions.push(
      or(ilike(notes.title, pattern), ilike(notes.contentMarkdown, pattern)) ??
        eq(notes.title, options.q),
    );
  }

  if (options.tag) {
    const normalizedName = normalizeTagName(options.tag);
    const matchingTags = await db
      .select({ noteId: noteTags.noteId })
      .from(noteTags)
      .innerJoin(
        tags,
        and(
          eq(noteTags.tagId, tags.id),
          eq(tags.userId, userId),
          eq(tags.normalizedName, normalizedName),
        ),
      );
    const noteIds = matchingTags.map((row) => row.noteId);
    if (noteIds.length === 0) {
      return { items: [], nextCursor: null };
    }
    conditions.push(inArray(notes.id, noteIds));
  }

  const cursorCondition = afterCursor(notes.updatedAt, notes.id, cursor);
  if (cursorCondition) {
    conditions.push(cursorCondition);
  }

  const rows = await db
    .select()
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.updatedAt), desc(notes.id))
    .limit(limit + 1);
  const pageRows = rows.slice(0, limit);
  const tagValues = await getTagValues(
    db,
    userId,
    pageRows.map((row) => row.id),
  );
  const items = pageRows.map((row) =>
    toNoteSummary(row, tagValues.get(row.id) ?? []),
  );
  const last = items.at(-1);

  return {
    items,
    nextCursor:
      rows.length > limit && last
        ? encodeCursor({ createdAt: last.updatedAt, id: last.id })
        : null,
  };
}

export async function getNote(userId: string, noteId: string): Promise<NoteDetail> {
  const db = getDb();
  const [note] = await db
    .select()
    .from(notes)
    .where(noteScope(userId, noteId))
    .limit(1);
  if (!note) {
    throw new NotFoundError("找不到请求的笔记。");
  }

  const tagValues = await getTagValues(db, userId, [note.id]);
  return {
    ...toNoteSummary(note, tagValues.get(note.id) ?? []),
    contentMarkdown: note.contentMarkdown,
    createdAt: note.createdAt,
  };
}

export async function updateNote(
  userId: string,
  noteId: string,
  input: unknown,
): Promise<NoteDetail> {
  const values = parseSchema(updateNoteSchema, input);
  const db = getDb();
  await requireOwnedNote(db, userId, noteId);

  await db.transaction(async (tx) => {
    const update: Partial<typeof notes.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (values.title !== undefined) update.title = values.title;
    if (values.contentMarkdown !== undefined) {
      update.contentMarkdown = values.contentMarkdown;
    }
    await tx.update(notes).set(update).where(noteScope(userId, noteId));
    if (values.contentMarkdown !== undefined) {
      await synchronizeWikilinkRelations(tx, userId, noteId, values.contentMarkdown);
    }
    if (values.tagNames !== undefined) {
      await replaceNoteTags(tx, userId, noteId, values.tagNames);
    }
  });

  return getNote(userId, noteId);
}

export async function archiveNote(userId: string, noteId: string): Promise<void> {
  const db = getDb();
  await requireOwnedNote(db, userId, noteId);
  await db
    .update(notes)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(noteScope(userId, noteId));
}

export async function restoreNote(userId: string, noteId: string): Promise<NoteDetail> {
  const db = getDb();
  await requireOwnedNote(db, userId, noteId);
  await db
    .update(notes)
    .set({ archivedAt: null, updatedAt: new Date() })
    .where(noteScope(userId, noteId));
  return getNote(userId, noteId);
}

export async function createTag(userId: string, input: unknown): Promise<TagSummary> {
  const values = parseSchema(createTagSchema, input);
  const name = values.name.trim();
  const normalizedName = normalizeTagName(name);
  const db = getDb();
  await db
    .insert(tags)
    .values({ userId, name, normalizedName })
    .onConflictDoNothing({ target: [tags.userId, tags.normalizedName] });

  const [tag] = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.normalizedName, normalizedName)))
    .limit(1);
  if (!tag) {
    throw new Error("标签创建失败。");
  }
  return { ...tag, noteCount: 0 };
}

export async function listTags(
  userId: string,
  options: ListTagsOptions = {},
): Promise<TagSummary[]> {
  const db = getDb();
  const limit = getLimit(options.limit);
  const conditions = [eq(tags.userId, userId)];
  if (options.q) {
    conditions.push(ilike(tags.name, `%${options.q}%`));
  }

  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      noteCount: count(notes.id),
    })
    .from(tags)
    .leftJoin(noteTags, eq(noteTags.tagId, tags.id))
    .leftJoin(
      notes,
      and(eq(notes.id, noteTags.noteId), eq(notes.userId, userId)),
    )
    .where(and(...conditions))
    .groupBy(tags.id)
    .orderBy(tags.name)
    .limit(limit);

  return rows.map((row) => ({ ...row, noteCount: Number(row.noteCount) }));
}

export async function attachTag(
  userId: string,
  noteId: string,
  input: unknown,
): Promise<NoteDetail> {
  const values = parseSchema(createTagSchema, input);
  const db = getDb();
  await requireOwnedNote(db, userId, noteId);
  const name = values.name.trim();
  const normalizedName = normalizeTagName(name);

  await db.transaction(async (tx) => {
    await tx
      .insert(tags)
      .values({ userId, name, normalizedName })
      .onConflictDoNothing({ target: [tags.userId, tags.normalizedName] });
    const [tag] = await tx
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.userId, userId), eq(tags.normalizedName, normalizedName)))
      .limit(1);
    if (!tag) {
      throw new Error("标签关联失败。");
    }
    await tx
      .insert(noteTags)
      .values({ noteId, tagId: tag.id })
      .onConflictDoNothing();
  });

  return getNote(userId, noteId);
}

export async function detachTag(
  userId: string,
  noteId: string,
  tagId: string,
): Promise<NoteDetail> {
  const db = getDb();
  await requireOwnedNote(db, userId, noteId);
  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
    .limit(1);
  if (!tag) {
    throw new NotFoundError("找不到请求的标签。");
  }

  await db
    .delete(noteTags)
    .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)));
  return getNote(userId, noteId);
}

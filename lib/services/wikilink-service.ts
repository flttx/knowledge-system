import { and, desc, eq, inArray, or } from "drizzle-orm";

import { getDb } from "@/db";
import { noteRelations, notes } from "@/db/schema";
import { makeExcerpt } from "@/lib/notes/normalization";
import { parseWikilinks } from "@/lib/wikilinks/parser";
import { NotFoundError } from "@/lib/services/errors";

type Database = ReturnType<typeof getDb>;
type Transaction = Parameters<Database["transaction"]>[0] extends (
  transaction: infer T,
  ...args: never[]
) => unknown
  ? T
  : never;
type DbExecutor = Database | Transaction;

export interface Backlink {
  noteId: string;
  title: string;
  relationType: "wikilink" | "manual";
  context: string;
}

export async function synchronizeWikilinkRelations(
  db: DbExecutor,
  userId: string,
  sourceNoteId: string,
  contentMarkdown: string,
): Promise<void> {
  const links = parseWikilinks(contentMarkdown);
  const titles = [...new Set(links.map((link) => link.targetTitle))];
  const targetIdsByTitle = new Map<string, string[]>();

  if (titles.length > 0) {
    const targetRows = await db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(and(eq(notes.userId, userId), inArray(notes.title, titles)));

    for (const row of targetRows) {
      const matches = targetIdsByTitle.get(row.title) ?? [];
      matches.push(row.id);
      targetIdsByTitle.set(row.title, matches);
    }
  }

  await db
    .delete(noteRelations)
    .where(
      and(
        eq(noteRelations.userId, userId),
        eq(noteRelations.sourceNoteId, sourceNoteId),
        eq(noteRelations.relationType, "wikilink"),
      ),
    );

  const relations = titles.flatMap((title) => {
    const targetIds = targetIdsByTitle.get(title) ?? [];
    if (targetIds.length !== 1 || targetIds[0] === sourceNoteId) return [];

    return [{
      userId,
      sourceNoteId,
      targetNoteId: targetIds[0],
      relationType: "wikilink" as const,
      status: "confirmed" as const,
      originKey: targetIds[0],
    }];
  });

  if (relations.length > 0) {
    await db.insert(noteRelations).values(relations).onConflictDoNothing();
  }
}

export async function getBacklinks(userId: string, noteId: string): Promise<Backlink[]> {
  const db = getDb();
  const [target] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  if (!target) throw new NotFoundError("找不到请求的笔记。");

  const rows = await db
    .select({
      noteId: notes.id,
      title: notes.title,
      contentMarkdown: notes.contentMarkdown,
      relationType: noteRelations.relationType,
    })
    .from(noteRelations)
    .innerJoin(
      notes,
      and(eq(noteRelations.sourceNoteId, notes.id), eq(notes.userId, userId)),
    )
    .where(
      and(
        eq(noteRelations.userId, userId),
        eq(noteRelations.targetNoteId, noteId),
        eq(noteRelations.status, "confirmed"),
        or(
          eq(noteRelations.relationType, "wikilink"),
          eq(noteRelations.relationType, "manual"),
        ),
      ),
    )
    .orderBy(desc(noteRelations.createdAt));

  return rows.map((row) => ({
    noteId: row.noteId,
    title: row.title,
    relationType: row.relationType as "wikilink" | "manual",
    context: makeExcerpt(row.contentMarkdown, 180),
  }));
}

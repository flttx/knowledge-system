import {
  and,
  asc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";

import { getDb } from "@/db";
import {
  highlights,
  noteRelations,
  noteTags,
  notes,
  quickNotes,
  sources,
  tags,
} from "@/db/schema";
import type {
  LocalAgentHighlight,
  LocalAgentNote,
  LocalAgentPullResponse,
  LocalAgentQuickNote,
  LocalAgentRelation,
  LocalAgentScope,
  LocalAgentSource,
} from "@/lib/local-agent/types";

function isoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

function sourceDto(source: typeof sources.$inferSelect): LocalAgentSource {
  return {
    id: source.id,
    title: source.title,
    publication: source.publication,
    author: source.author,
    issue: source.issue,
    sourceType: source.sourceType,
    url: source.url,
    publishedAt: isoDate(source.publishedAt),
    archivedAt: isoDate(source.archivedAt),
  };
}

function highlightDto(
  highlight: typeof highlights.$inferSelect,
): LocalAgentHighlight {
  return {
    id: highlight.id,
    sourceId: highlight.sourceId,
    text: highlight.text,
    page: highlight.page,
    location: highlight.location,
    personalComment: highlight.personalComment,
    status: highlight.status,
    archivedAt: isoDate(highlight.archivedAt),
    createdAt: highlight.createdAt.toISOString(),
    updatedAt: highlight.updatedAt.toISOString(),
  };
}

function quickNoteDto(
  quickNote: typeof quickNotes.$inferSelect,
): LocalAgentQuickNote {
  return {
    id: quickNote.id,
    sourceId: quickNote.sourceId,
    content: quickNote.content,
    status: quickNote.status,
    archivedAt: isoDate(quickNote.archivedAt),
    createdAt: quickNote.createdAt.toISOString(),
    updatedAt: quickNote.updatedAt.toISOString(),
  };
}

function noteDto(
  note: typeof notes.$inferSelect,
  noteTagsByNote: Map<string, string[]>,
): LocalAgentNote {
  return {
    id: note.id,
    title: note.title,
    slug: note.slug,
    contentMarkdown: note.contentMarkdown,
    tags: noteTagsByNote.get(note.id) ?? [],
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    archivedAt: isoDate(note.archivedAt),
  };
}

function relationDto(
  relation: typeof noteRelations.$inferSelect,
): LocalAgentRelation {
  return {
    id: relation.id,
    sourceNoteId: relation.sourceNoteId,
    targetNoteId: relation.targetNoteId,
    relationType: relation.relationType,
    status: relation.status === "rejected" ? "rejected" : "confirmed",
    reason: relation.reason,
    createdAt: relation.createdAt.toISOString(),
    updatedAt: relation.updatedAt.toISOString(),
  };
}

export async function pullKnowledge(
  userId: string,
  scope: LocalAgentScope,
): Promise<LocalAgentPullResponse> {
  const db = getDb();
  const inboxOnly = scope === "inbox";
  const includeInbox = scope !== "notes";
  const includeNotes = scope !== "inbox";

  const [highlightRows, quickNoteRows, noteRows] = await Promise.all([
    includeInbox
      ? db
          .select()
          .from(highlights)
          .where(
            inboxOnly
              ? and(
                  eq(highlights.userId, userId),
                  eq(highlights.status, "inbox"),
                  isNull(highlights.archivedAt),
                )
              : eq(highlights.userId, userId),
          )
          .orderBy(asc(highlights.createdAt), asc(highlights.id))
      : Promise.resolve([]),
    includeInbox
      ? db
          .select()
          .from(quickNotes)
          .where(
            inboxOnly
              ? and(
                  eq(quickNotes.userId, userId),
                  eq(quickNotes.status, "inbox"),
                  isNull(quickNotes.archivedAt),
                )
              : eq(quickNotes.userId, userId),
          )
          .orderBy(asc(quickNotes.createdAt), asc(quickNotes.id))
      : Promise.resolve([]),
    includeNotes
      ? db
          .select()
          .from(notes)
          .where(and(eq(notes.userId, userId), isNull(notes.archivedAt)))
          .orderBy(asc(notes.updatedAt), asc(notes.id))
      : Promise.resolve([]),
  ]);

  const noteIds = noteRows.map((note) => note.id);
  const noteTagsByNote = new Map<string, string[]>();
  if (noteIds.length > 0) {
    const tagRows = await db
      .select({ noteId: noteTags.noteId, name: tags.name })
      .from(noteTags)
      .innerJoin(tags, and(eq(noteTags.tagId, tags.id), eq(tags.userId, userId)))
      .where(inArray(noteTags.noteId, noteIds))
      .orderBy(asc(tags.name));
    for (const tagRow of tagRows) {
      const values = noteTagsByNote.get(tagRow.noteId) ?? [];
      values.push(tagRow.name);
      noteTagsByNote.set(tagRow.noteId, values);
    }
  }

  const relations = noteIds.length > 0
    ? await db
        .select()
        .from(noteRelations)
        .where(
          and(
            eq(noteRelations.userId, userId),
            inArray(noteRelations.status, ["confirmed", "rejected"]),
            inArray(noteRelations.sourceNoteId, noteIds),
            inArray(noteRelations.targetNoteId, noteIds),
          ),
        )
        .orderBy(asc(noteRelations.createdAt), asc(noteRelations.id))
    : [];

  const sourceIds = [
    ...new Set(
      [...highlightRows, ...quickNoteRows]
        .map((item) => item.sourceId)
        .filter((sourceId): sourceId is string => sourceId !== null),
    ),
  ];
  const sourceRows = scope === "all"
    ? await db
        .select()
        .from(sources)
        .where(eq(sources.userId, userId))
        .orderBy(asc(sources.createdAt), asc(sources.id))
    : sourceIds.length > 0
      ? await db
          .select()
          .from(sources)
          .where(and(eq(sources.userId, userId), inArray(sources.id, sourceIds)))
          .orderBy(asc(sources.createdAt), asc(sources.id))
      : [];

  const response: LocalAgentPullResponse = {
    version: 1,
    scope,
    generatedAt: new Date().toISOString(),
    inbox: {
      highlights: highlightRows.map(highlightDto),
      quickNotes: quickNoteRows.map(quickNoteDto),
    },
    sources: sourceRows.map(sourceDto),
    notes: noteRows.map((note) => noteDto(note, noteTagsByNote)),
    relations: relations.map(relationDto),
    counts: {
      highlights: highlightRows.length,
      quickNotes: quickNoteRows.length,
      sources: sourceRows.length,
      notes: noteRows.length,
      relations: relations.length,
    },
  };

  return response;
}

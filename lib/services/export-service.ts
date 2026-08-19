import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  attachments,
  highlights,
  noteRelations,
  noteTags,
  notes,
  quickNotes,
  sources,
  tags,
} from "@/db/schema";
import { createZip, type ZipEntry } from "@/lib/export/zip";

export interface ExportManifest {
  version: 1;
  exportedAt: string;
  format: "knowledge-archive";
  counts: {
    notes: number;
    sources: number;
    highlights: number;
    quickNotes: number;
    relations: number;
    attachments: number;
  };
}

export interface KnowledgeArchive {
  bytes: Uint8Array;
  fileName: string;
  files: string[];
  manifest: ExportManifest;
}

interface ExportSnapshot {
  notes: (typeof notes.$inferSelect)[];
  noteTags: { noteId: string; name: string }[];
  sources: (typeof sources.$inferSelect)[];
  highlights: (typeof highlights.$inferSelect)[];
  quickNotes: (typeof quickNotes.$inferSelect)[];
  relations: (typeof noteRelations.$inferSelect)[];
  attachments: (typeof attachments.$inferSelect)[];
}

function isoDate(value: Date | null): string | null {
  return value?.toISOString() ?? null;
}

export function sanitizeExportFileName(title: string): string {
  const sanitized = title
    .normalize("NFC")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/[. ]+$/g, "")
    .trim();
  const limited = Array.from(sanitized).slice(0, 120).join("");
  if (!limited || /^[. -]+$/.test(limited)) {
    return "untitled-note";
  }
  if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i.test(limited)) {
    return `${limited}-note`;
  }
  return limited;
}

function noteMarkdown(
  note: typeof notes.$inferSelect,
  tagNames: string[],
): string {
  const lines = [
    "---",
    `id: ${note.id}`,
    `created: ${note.createdAt.toISOString()}`,
    `updated: ${note.updatedAt.toISOString()}`,
    "tags:",
  ];

  if (tagNames.length === 0) {
    lines[lines.length - 1] = "tags: []";
  } else {
    lines.push(...tagNames.map((tagName) => `  - ${JSON.stringify(tagName)}`));
  }
  if (note.archivedAt) {
    lines.push(`archived: ${note.archivedAt.toISOString()}`);
  }
  lines.push("---");
  return `${lines.join("\n")}\n${note.contentMarkdown}`;
}

function jsonEntry(path: string, value: unknown): ZipEntry {
  return {
    path,
    data: Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8"),
  };
}

async function readSnapshot(userId: string): Promise<ExportSnapshot> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`set transaction isolation level repeatable read`);

    const exportNotes = await tx
      .select()
      .from(notes)
      .where(eq(notes.userId, userId))
      .orderBy(asc(notes.title), asc(notes.id));
    const noteIds = exportNotes.map((note) => note.id);
    const exportNoteTags = noteIds.length
      ? await tx
          .select({ noteId: noteTags.noteId, name: tags.name })
          .from(noteTags)
          .innerJoin(
            tags,
            and(eq(noteTags.tagId, tags.id), eq(tags.userId, userId)),
          )
          .where(inArray(noteTags.noteId, noteIds))
          .orderBy(asc(noteTags.noteId), asc(tags.name))
      : [];
    const exportSources = await tx
      .select()
      .from(sources)
      .where(eq(sources.userId, userId))
      .orderBy(asc(sources.title), asc(sources.id));
    const exportHighlights = await tx
      .select()
      .from(highlights)
      .where(eq(highlights.userId, userId))
      .orderBy(asc(highlights.createdAt), asc(highlights.id));
    const exportQuickNotes = await tx
      .select()
      .from(quickNotes)
      .where(eq(quickNotes.userId, userId))
      .orderBy(asc(quickNotes.createdAt), asc(quickNotes.id));
    const relationRows = await tx
      .select()
      .from(noteRelations)
      .where(eq(noteRelations.userId, userId))
      .orderBy(asc(noteRelations.createdAt), asc(noteRelations.id));
    const exportNoteIdSet = new Set(noteIds);
    const exportRelations = relationRows.filter(
      (relation) =>
        exportNoteIdSet.has(relation.sourceNoteId) &&
        exportNoteIdSet.has(relation.targetNoteId),
    );
    const exportAttachments = await tx
      .select()
      .from(attachments)
      .where(eq(attachments.userId, userId))
      .orderBy(asc(attachments.createdAt), asc(attachments.id));

    return {
      notes: exportNotes,
      noteTags: exportNoteTags,
      sources: exportSources,
      highlights: exportHighlights,
      quickNotes: exportQuickNotes,
      relations: exportRelations,
      attachments: exportAttachments,
    };
  });
}

function uniqueNotePaths(exportNotes: ExportSnapshot["notes"]): Map<string, string> {
  const counts = new Map<string, number>();
  const paths = new Map<string, string>();
  for (const note of exportNotes) {
    const stem = sanitizeExportFileName(note.title);
    const count = (counts.get(stem) ?? 0) + 1;
    counts.set(stem, count);
    const suffix = count === 1 ? "" : `-${count}`;
    const directory = note.archivedAt ? "Archive" : "Notes";
    paths.set(note.id, `knowledge-export/${directory}/${stem}${suffix}.md`);
  }
  return paths;
}

function sourceExport(source: typeof sources.$inferSelect) {
  return {
    id: source.id,
    title: source.title,
    publication: source.publication,
    author: source.author,
    issue: source.issue,
    sourceType: source.sourceType,
    url: source.url,
    publishedAt: isoDate(source.publishedAt),
    createdAt: source.createdAt.toISOString(),
    updatedAt: source.updatedAt.toISOString(),
    archivedAt: isoDate(source.archivedAt),
  };
}

function highlightExport(highlight: typeof highlights.$inferSelect) {
  return {
    id: highlight.id,
    sourceId: highlight.sourceId,
    text: highlight.text,
    page: highlight.page,
    location: highlight.location,
    personalComment: highlight.personalComment,
    status: highlight.status,
    createdAt: highlight.createdAt.toISOString(),
    updatedAt: highlight.updatedAt.toISOString(),
    archivedAt: isoDate(highlight.archivedAt),
  };
}

function quickNoteExport(quickNote: typeof quickNotes.$inferSelect) {
  return {
    id: quickNote.id,
    sourceId: quickNote.sourceId,
    content: quickNote.content,
    status: quickNote.status,
    createdAt: quickNote.createdAt.toISOString(),
    updatedAt: quickNote.updatedAt.toISOString(),
    archivedAt: isoDate(quickNote.archivedAt),
  };
}

function relationExport(relation: typeof noteRelations.$inferSelect) {
  return {
    id: relation.id,
    sourceNoteId: relation.sourceNoteId,
    targetNoteId: relation.targetNoteId,
    relationType: relation.relationType,
    status: relation.status,
    confidence: relation.confidence === null ? null : Number(relation.confidence),
    reason: relation.reason,
    originKey: relation.originKey,
    createdAt: relation.createdAt.toISOString(),
    updatedAt: relation.updatedAt.toISOString(),
  };
}

function attachmentExport(attachment: typeof attachments.$inferSelect) {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    sourceId: attachment.sourceId,
    noteId: attachment.noteId,
    createdAt: attachment.createdAt.toISOString(),
    exportStatus: "metadata-only" as const,
  };
}

export async function createKnowledgeArchive(userId: string): Promise<KnowledgeArchive> {
  const snapshot = await readSnapshot(userId);
  const exportedAt = new Date().toISOString();
  const tagNamesByNote = new Map<string, string[]>();
  for (const tag of snapshot.noteTags) {
    const names = tagNamesByNote.get(tag.noteId) ?? [];
    names.push(tag.name);
    tagNamesByNote.set(tag.noteId, names);
  }

  const notePaths = uniqueNotePaths(snapshot.notes);
  const manifest: ExportManifest = {
    version: 1,
    exportedAt,
    format: "knowledge-archive",
    counts: {
      notes: snapshot.notes.length,
      sources: snapshot.sources.length,
      highlights: snapshot.highlights.length,
      quickNotes: snapshot.quickNotes.length,
      relations: snapshot.relations.length,
      attachments: snapshot.attachments.length,
    },
  };

  const entries: ZipEntry[] = [
    { path: "knowledge-export/", data: new Uint8Array() },
    { path: "knowledge-export/Notes/", data: new Uint8Array() },
    { path: "knowledge-export/Archive/", data: new Uint8Array() },
    { path: "knowledge-export/Sources/", data: new Uint8Array() },
    { path: "knowledge-export/Highlights/", data: new Uint8Array() },
    { path: "knowledge-export/QuickNotes/", data: new Uint8Array() },
    { path: "knowledge-export/Assets/", data: new Uint8Array() },
  ];

  for (const note of snapshot.notes) {
    entries.push({
      path: notePaths.get(note.id) ?? `knowledge-export/Notes/${note.id}.md`,
      data: Buffer.from(noteMarkdown(note, tagNamesByNote.get(note.id) ?? []), "utf8"),
      modifiedAt: note.updatedAt,
    });
  }

  entries.push(
    jsonEntry("knowledge-export/Sources/sources.json", snapshot.sources.map(sourceExport)),
    jsonEntry("knowledge-export/Highlights/highlights.json", snapshot.highlights.map(highlightExport)),
    jsonEntry("knowledge-export/QuickNotes/quick-notes.json", snapshot.quickNotes.map(quickNoteExport)),
    jsonEntry("knowledge-export/relations.json", snapshot.relations.map(relationExport)),
    jsonEntry("knowledge-export/Assets/attachments.json", snapshot.attachments.map(attachmentExport)),
    jsonEntry("knowledge-export/manifest.json", manifest),
  );

  const bytes = createZip(entries);
  return {
    bytes,
    fileName: `knowledge-export-${exportedAt.slice(0, 10)}.zip`,
    files: entries.map((entry) => entry.path),
    manifest,
  };
}

export { noteMarkdown };

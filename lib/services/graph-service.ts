import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";

import { getDb } from "@/db";
import { noteRelations, noteTags, notes, tags } from "@/db/schema";
import { normalizeTagName } from "@/lib/notes/normalization";
import { NotFoundError } from "@/lib/services/errors";
import type {
  GraphEdge,
  GraphNode,
  GraphRelationStatus,
  GraphRelationType,
  GraphResult,
  GlobalGraphOptions,
  LocalGraphOptions,
} from "@/lib/graph/types";

export const DEFAULT_GRAPH_LIMIT = 100;
export const MAX_GRAPH_LIMIT = 200;

interface GraphRelationRow {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  relationType: GraphRelationType;
  status: GraphRelationStatus;
}

interface NoteRow {
  id: string;
  title: string;
}

function allowedStatuses(includeSuggested: boolean): GraphRelationStatus[] {
  return includeSuggested ? ["confirmed", "suggested"] : ["confirmed"];
}

function safeLimit(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return DEFAULT_GRAPH_LIMIT;
  return Math.min(MAX_GRAPH_LIMIT, Math.max(1, Math.floor(value)));
}

async function getActiveNotes(userId: string, noteIds?: string[]): Promise<NoteRow[]> {
  const db = getDb();
  if (noteIds && noteIds.length === 0) return [];

  return db
    .select({ id: notes.id, title: notes.title })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        isNull(notes.archivedAt),
        noteIds ? inArray(notes.id, noteIds) : undefined,
      ),
    );
}

async function getRelationRows(
  userId: string,
  options: {
    includeSuggested: boolean;
    relationType?: GraphRelationType;
    noteIds?: string[];
  },
): Promise<GraphRelationRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: noteRelations.id,
      sourceNoteId: noteRelations.sourceNoteId,
      targetNoteId: noteRelations.targetNoteId,
      relationType: noteRelations.relationType,
      status: noteRelations.status,
    })
    .from(noteRelations)
    .where(
      and(
        eq(noteRelations.userId, userId),
        inArray(noteRelations.status, allowedStatuses(options.includeSuggested)),
        options.relationType
          ? eq(noteRelations.relationType, options.relationType)
          : undefined,
        options.noteIds?.length
          ? or(
              inArray(noteRelations.sourceNoteId, options.noteIds),
              inArray(noteRelations.targetNoteId, options.noteIds),
            )
          : undefined,
      ),
    );

  return rows.filter((row): row is GraphRelationRow => row.status !== "rejected");
}

async function getTagNames(userId: string, noteIds: string[]): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (noteIds.length === 0) return result;

  const rows = await getDb()
    .select({ noteId: noteTags.noteId, name: tags.name })
    .from(noteTags)
    .innerJoin(tags, and(eq(noteTags.tagId, tags.id), eq(tags.userId, userId)))
    .where(inArray(noteTags.noteId, noteIds));

  for (const row of rows) {
    const names = result.get(row.noteId) ?? [];
    names.push(row.name);
    result.set(row.noteId, names);
  }
  return result;
}

function toGraphEdges(rows: GraphRelationRow[], visibleIds: Set<string>): GraphEdge[] {
  const seen = new Set<string>();
  const edges: GraphEdge[] = [];
  for (const row of rows) {
    if (!visibleIds.has(row.sourceNoteId) || !visibleIds.has(row.targetNoteId)) continue;
    const key = `${row.sourceNoteId}:${row.targetNoteId}:${row.relationType}:${row.status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({
      id: row.id,
      source: row.sourceNoteId,
      target: row.targetNoteId,
      relationType: row.relationType,
      status: row.status,
    });
  }
  return edges;
}

function toGraphNodes(rows: NoteRow[], tagNames: Map<string, string[]>): GraphNode[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    tags: tagNames.get(row.id) ?? [],
  }));
}

export async function getLocalGraph(
  userId: string,
  noteId: string,
  options: LocalGraphOptions = {},
): Promise<GraphResult> {
  const depth = options.depth === 2 ? 2 : 1;
  const relationRows = await getRelationRows(userId, {
    includeSuggested: options.includeSuggested === true,
  });
  const relatedIds = new Set<string>([noteId]);
  const adjacency = new Map<string, string[]>();

  for (const relation of relationRows) {
    const sourceNeighbors = adjacency.get(relation.sourceNoteId) ?? [];
    sourceNeighbors.push(relation.targetNoteId);
    adjacency.set(relation.sourceNoteId, sourceNeighbors);
    const targetNeighbors = adjacency.get(relation.targetNoteId) ?? [];
    targetNeighbors.push(relation.sourceNoteId);
    adjacency.set(relation.targetNoteId, targetNeighbors);
  }

  const distances = new Map([[noteId, 0]]);
  const queue = [noteId];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    const currentDistance = distances.get(current) ?? 0;
    if (currentDistance >= depth) continue;
    for (const neighbor of adjacency.get(current) ?? []) {
      if (distances.has(neighbor)) continue;
      distances.set(neighbor, currentDistance + 1);
      relatedIds.add(neighbor);
      queue.push(neighbor);
    }
  }

  const noteRows = await getActiveNotes(userId, [...relatedIds]);
  if (!noteRows.some((note) => note.id === noteId)) {
    throw new NotFoundError("找不到请求的笔记。");
  }
  const visibleIds = new Set(noteRows.map((note) => note.id));
  const tagNames = await getTagNames(userId, [...visibleIds]);
  return {
    nodes: toGraphNodes(noteRows, tagNames),
    edges: toGraphEdges(relationRows, visibleIds),
  };
}

export async function getGlobalGraph(
  userId: string,
  options: GlobalGraphOptions = {},
): Promise<GraphResult> {
  const limit = safeLimit(options.limit);
  const db = getDb();
  let tagNoteIds: string[] | undefined;
  if (options.tag?.trim()) {
    const tagRows = await db
      .select({ noteId: noteTags.noteId })
      .from(noteTags)
      .innerJoin(tags, and(eq(noteTags.tagId, tags.id), eq(tags.userId, userId)))
      .where(eq(tags.normalizedName, normalizeTagName(options.tag)));
    tagNoteIds = [...new Set(tagRows.map((row) => row.noteId))];
    if (tagNoteIds.length === 0) return { nodes: [], edges: [] };
  }

  const candidateRows = await db
    .select({ id: notes.id, title: notes.title })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        isNull(notes.archivedAt),
        tagNoteIds ? inArray(notes.id, tagNoteIds) : undefined,
      ),
    )
    .orderBy(desc(notes.updatedAt), desc(notes.id))
    .limit(limit);
  if (candidateRows.length === 0) return { nodes: [], edges: [] };

  const visibleIds = new Set(candidateRows.map((note) => note.id));
  const relationRows = await getRelationRows(userId, {
    includeSuggested: options.includeSuggested === true,
    relationType: options.relationType,
    noteIds: [...visibleIds],
  });
  const tagNames = await getTagNames(userId, [...visibleIds]);
  return {
    nodes: toGraphNodes(candidateRows, tagNames),
    edges: toGraphEdges(relationRows, visibleIds),
  };
}

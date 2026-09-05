import { inboxAfter, type InboxBoundary } from "./inbox-pagination";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  or,
} from "drizzle-orm";

import { getDb } from "@/db";
import {
  aiSuggestions,
  highlights,
  noteRelations,
  notes,
  quickNotes,
} from "@/db/schema";
import {
  acceptDurableNoteSchema,
  parseLocalSuggestion,
  suggestionImportRequestSchema,
  type DurableNoteSuggestion,
  type LocalSuggestion,
  type RelationSuggestion,
  type SuggestionSourceReference,
} from "@/lib/local-agent/suggestions";
import {
  canonicalRelationEndpoints,
  relationOriginKey,
} from "@/lib/local-agent/relation";
import { hashLocalSuggestion } from "@/lib/local-agent/suggestion-hash";
import {
  createNoteInTransaction,
  type NoteDbExecutor,
} from "@/lib/services/note-service";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/services/errors";

interface StoredSuggestionPayload {
  suggestion: LocalSuggestion;
  raw: Record<string, unknown>;
  acceptedNoteId: string | null;
  acceptedRelationId: string | null;
}

export interface SuggestionSummary {
  id: string;
  type: LocalSuggestion["type"];
  payload: LocalSuggestion;
  status: string;
  createdAt: Date;
  reviewedAt: Date | null;
  sourceReferenceCount: number;
  relation?: {
    sourceNoteId: string;
    targetNoteId: string;
    sourceTitle: string | null;
    targetTitle: string | null;
    relationType: RelationSuggestion["relationType"];
    reason: string;
    confidence: number;
  };
}

export interface SuggestionImportResult {
  localId: string;
  suggestionId: string;
  type: LocalSuggestion["type"];
  status: "imported" | "already_present";
}

export interface SuggestionImportResponse {
  items: SuggestionImportResult[];
  counts: {
    validated: number;
    imported: number;
    alreadyPresent: number;
  };
}

export interface DurableNoteAcceptanceResult {
  suggestionId: string;
  status: "accepted";
  createdNoteId: string;
}

export interface RelationAcceptanceResult {
  suggestionId: string;
  status: "accepted";
  relationId: string;
}

export type SuggestionAcceptanceResult =
  | DurableNoteAcceptanceResult
  | RelationAcceptanceResult;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredPayload(payload: unknown): StoredSuggestionPayload {
  if (!isRecord(payload)) {
    throw new ValidationError({ payload: "Stored suggestion payload is invalid." });
  }

  const raw = { ...payload };
  const acceptance = raw.acceptance;
  delete raw.acceptance;
  const suggestion = parseLocalSuggestion(raw);
  const acceptedNoteId =
    isRecord(acceptance) && typeof acceptance.noteId === "string"
      ? acceptance.noteId
      : null;
  const acceptedRelationId =
    isRecord(acceptance) && typeof acceptance.relationId === "string"
      ? acceptance.relationId
      : null;
  return { suggestion, raw, acceptedNoteId, acceptedRelationId };
}

function parseImportInput(input: unknown): LocalSuggestion[] {
  const result = suggestionImportRequestSchema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors as unknown as Record<string, unknown>);
  }
  return result.data.suggestions;
}

function parseAcceptInput(input: unknown): {
  title?: string;
  bodyMarkdown?: string;
  tagNames?: string[];
} {
  const result = acceptDurableNoteSchema.safeParse(input ?? {});
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors as unknown as Record<string, unknown>);
  }
  return result.data;
}

async function assertSourceReferencesOwned(
  db: NoteDbExecutor,
  userId: string,
  references: SuggestionSourceReference[],
): Promise<void> {
  const highlightIds = references
    .filter((reference) => reference.type === "highlight")
    .map((reference) => reference.id);
  const quickNoteIds = references
    .filter((reference) => reference.type === "quick_note")
    .map((reference) => reference.id);

  const ownedHighlightIds = highlightIds.length
    ? await db
        .select({ id: highlights.id })
        .from(highlights)
        .where(
          and(
            eq(highlights.userId, userId),
            inArray(highlights.id, highlightIds),
            isNull(highlights.archivedAt),
          ),
        )
    : [];
  const ownedQuickNoteIds = quickNoteIds.length
    ? await db
        .select({ id: quickNotes.id })
        .from(quickNotes)
        .where(
          and(
            eq(quickNotes.userId, userId),
            inArray(quickNotes.id, quickNoteIds),
            isNull(quickNotes.archivedAt),
          ),
        )
    : [];
  const ownedIds = new Set([
    ...ownedHighlightIds.map((row) => `highlight:${row.id}`),
    ...ownedQuickNoteIds.map((row) => `quick_note:${row.id}`),
  ]);
  const missing = references.filter(
    (reference) => !ownedIds.has(`${reference.type}:${reference.id}`),
  );
  if (missing.length > 0) {
    throw new ValidationError({
      sourceReferences: "One or more source references are unavailable.",
    });
  }
}

function normalizeSuggestion(suggestion: LocalSuggestion): LocalSuggestion {
  if (suggestion.type !== "relation") return suggestion;
  const endpoints = canonicalRelationEndpoints(
    suggestion.relationType,
    suggestion.sourceNoteId,
    suggestion.targetNoteId,
  );
  return { ...suggestion, ...endpoints };
}

async function assertRelationNotesOwned(
  db: NoteDbExecutor,
  userId: string,
  suggestion: RelationSuggestion,
): Promise<void> {
  const noteRows = await db
    .select({ id: notes.id })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        inArray(notes.id, [suggestion.sourceNoteId, suggestion.targetNoteId]),
        isNull(notes.archivedAt),
      ),
    );
  if (noteRows.length !== 2) {
    throw new ValidationError({
      sourceNoteId: "Both referenced Notes must belong to the user and remain active.",
      targetNoteId: "Both referenced Notes must belong to the user and remain active.",
    });
  }
}

async function findRelationMemory(
  db: NoteDbExecutor,
  userId: string,
  suggestion: RelationSuggestion,
): Promise<{ id: string; status: "confirmed" | "rejected" } | null> {
  const direction = suggestion.relationType === "semantic"
    ? or(
        and(
          eq(noteRelations.sourceNoteId, suggestion.sourceNoteId),
          eq(noteRelations.targetNoteId, suggestion.targetNoteId),
        ),
        and(
          eq(noteRelations.sourceNoteId, suggestion.targetNoteId),
          eq(noteRelations.targetNoteId, suggestion.sourceNoteId),
        ),
      )
    : and(
        eq(noteRelations.sourceNoteId, suggestion.sourceNoteId),
        eq(noteRelations.targetNoteId, suggestion.targetNoteId),
      );
  const [row] = await db
    .select({ id: noteRelations.id, status: noteRelations.status })
    .from(noteRelations)
    .where(
      and(
        eq(noteRelations.userId, userId),
        inArray(noteRelations.status, ["confirmed", "rejected"]),
        direction,
      ),
    )
    .orderBy(asc(noteRelations.createdAt), asc(noteRelations.id))
    .limit(1);
  return row?.status === "confirmed" || row?.status === "rejected"
    ? { id: row.id, status: row.status }
    : null;
}

async function assertRelationCanBeImported(
  db: NoteDbExecutor,
  userId: string,
  suggestion: RelationSuggestion,
): Promise<void> {
  const memory = await findRelationMemory(db, userId, suggestion);
  if (memory?.status === "confirmed") {
    throw new ConflictError("This Note relation is already confirmed.");
  }
  if (memory?.status === "rejected") {
    throw new ConflictError("This Note relation was previously rejected.");
  }
}

export async function importSuggestions(
  userId: string,
  input: unknown,
): Promise<SuggestionImportResponse> {
  const suggestions = parseImportInput(input);
  const db = getDb();

  return db.transaction(async (tx) => {
    const items: SuggestionImportResult[] = [];
    let imported = 0;
    let alreadyPresent = 0;

    for (const rawSuggestion of suggestions) {
      const suggestion = normalizeSuggestion(rawSuggestion);
      if (suggestion.type === "relation") {
        await assertRelationNotesOwned(tx, userId, suggestion);
      } else {
        await assertSourceReferencesOwned(tx, userId, suggestion.sourceReferences);
      }
      const inputHash = hashLocalSuggestion(suggestion);
      const [existing] = await tx
        .select({ id: aiSuggestions.id })
        .from(aiSuggestions)
        .where(
          and(
            eq(aiSuggestions.userId, userId),
            eq(aiSuggestions.inputHash, inputHash),
          ),
        )
        .limit(1);
      if (existing) {
        alreadyPresent += 1;
        items.push({
          localId: rawSuggestion.id,
          suggestionId: existing.id,
          type: suggestion.type,
          status: "already_present",
        });
        continue;
      }
      if (suggestion.type === "relation") {
        await assertRelationCanBeImported(tx, userId, suggestion);
      }
      const [created] = await tx
        .insert(aiSuggestions)
        .values({
          userId,
          suggestionType: suggestion.type,
          sourceObjectType: suggestion.type === "relation" ? "note" : suggestion.sourceReferences[0]!.type,
          sourceObjectId: suggestion.type === "relation" ? suggestion.sourceNoteId : suggestion.sourceReferences[0]!.id,
          payload: suggestion as unknown as Record<string, unknown>,
          inputHash,
          promptVersion: suggestion.type === "relation" ? "codex-relation:v1" : "codex-inbox:v1",
          status: "pending",
        })
        .onConflictDoNothing({
          target: [aiSuggestions.userId, aiSuggestions.inputHash],
        })
        .returning({ id: aiSuggestions.id });

      const suggestionId = created?.id;
      if (!suggestionId) {
        throw new Error("Suggestion import did not return an ID.");
      }

      imported += 1;
      items.push({
        localId: rawSuggestion.id,
        suggestionId,
        type: suggestion.type,
        status: "imported",
      });
    }

    return {
      items,
      counts: {
        validated: suggestions.length,
        imported,
        alreadyPresent,
      },
    };
  });
}

function toSummary(
  row: typeof aiSuggestions.$inferSelect,
  noteTitles: Map<string, string>,
): SuggestionSummary {
  const stored = parseStoredPayload(row.payload);
  const relation = stored.suggestion.type === "relation" ? stored.suggestion : null;
  return {
    id: row.id,
    type: stored.suggestion.type,
    payload: stored.suggestion,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt,
    sourceReferenceCount: stored.suggestion.type === "relation"
      ? 0
      : stored.suggestion.sourceReferences.length,
    ...(relation
      ? {
          relation: {
            sourceNoteId: relation.sourceNoteId,
            targetNoteId: relation.targetNoteId,
            sourceTitle: noteTitles.get(relation.sourceNoteId) ?? null,
            targetTitle: noteTitles.get(relation.targetNoteId) ?? null,
            relationType: relation.relationType,
            reason: relation.reason,
            confidence: relation.confidence,
          },
        }
      : {}),
  };
}

export async function listPendingSuggestions(
  userId: string,
  limit = 100,
  inboxPage?: { boundary?: InboxBoundary },
): Promise<SuggestionSummary[]> {
  const db = getDb();
  const conditions = [eq(aiSuggestions.userId, userId), eq(aiSuggestions.status, "pending")];
  const inboxCondition = inboxAfter(aiSuggestions.createdAt, aiSuggestions.id, "ai_suggestion", inboxPage?.boundary);
  if (inboxCondition) conditions.push(inboxCondition);
  const rows = await db
    .select()
    .from(aiSuggestions)
    .where(and(...conditions))
    .orderBy(...(inboxPage ? [desc(aiSuggestions.createdAt), desc(aiSuggestions.id)] : [asc(aiSuggestions.createdAt), asc(aiSuggestions.id)]))
    .limit(limit);
  const relationNoteIds = rows.flatMap((row) => {
    const suggestion = parseStoredPayload(row.payload).suggestion;
    return suggestion.type === "relation"
      ? [suggestion.sourceNoteId, suggestion.targetNoteId]
      : [];
  });
  const noteTitles = new Map<string, string>();
  if (relationNoteIds.length > 0) {
    const noteRows = await db
      .select({ id: notes.id, title: notes.title })
      .from(notes)
      .where(and(eq(notes.userId, userId), inArray(notes.id, relationNoteIds)));
    for (const row of noteRows) noteTitles.set(row.id, row.title);
  }
  return rows.map((row) => toSummary(row, noteTitles));
}

async function getOwnedSuggestion(
  db: NoteDbExecutor,
  userId: string,
  suggestionId: string,
  lock = false,
) {
  const query = db
    .select()
    .from(aiSuggestions)
    .where(and(eq(aiSuggestions.id, suggestionId), eq(aiSuggestions.userId, userId)));
  const [suggestion] = lock
    ? await query.for("update").limit(1)
    : await query.limit(1);
  if (!suggestion) {
    throw new NotFoundError("Suggestion not found.");
  }
  return suggestion;
}

export async function setSuggestionStatus(
  userId: string,
  suggestionId: string,
  nextStatus: "rejected" | "ignored",
): Promise<{ id: string; status: "rejected" | "ignored" }> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const suggestion = await getOwnedSuggestion(tx, userId, suggestionId, true);
    if (suggestion.status === nextStatus) {
      return { id: suggestion.id, status: nextStatus };
    }
    if (suggestion.status !== "pending") {
      throw new ConflictError("Only pending suggestions can be reviewed.");
    }
    const stored = parseStoredPayload(suggestion.payload);
    if (nextStatus === "rejected" && stored.suggestion.type === "relation") {
      await assertRelationNotesOwned(tx, userId, stored.suggestion);
      await tx
        .insert(noteRelations)
        .values({
          userId,
          sourceNoteId: stored.suggestion.sourceNoteId,
          targetNoteId: stored.suggestion.targetNoteId,
          relationType: stored.suggestion.relationType,
          status: "rejected",
          confidence: String(stored.suggestion.confidence),
          reason: stored.suggestion.reason,
          originKey: relationOriginKey(
            stored.suggestion.relationType,
            stored.suggestion.sourceNoteId,
            stored.suggestion.targetNoteId,
          ),
        })
        .onConflictDoNothing();
    }
    await tx
      .update(aiSuggestions)
      .set({ status: nextStatus, reviewedAt: new Date() })
      .where(
        and(
          eq(aiSuggestions.id, suggestionId),
          eq(aiSuggestions.userId, userId),
          eq(aiSuggestions.status, "pending"),
        ),
      );
    return { id: suggestion.id, status: nextStatus };
  });
}

function durablePayload(suggestion: LocalSuggestion): DurableNoteSuggestion {
  if (suggestion.type !== "durable_note") {
    throw new ValidationError({ type: "Only durable_note suggestions can be accepted." });
  }
  return suggestion;
}

export async function acceptDurableNote(
  userId: string,
  suggestionId: string,
  input: unknown,
): Promise<DurableNoteAcceptanceResult> {
  const edits = parseAcceptInput(input);
  const db = getDb();

  return db.transaction(async (tx) => {
    const suggestion = await getOwnedSuggestion(tx, userId, suggestionId, true);
    const stored = parseStoredPayload(suggestion.payload);
    if (suggestion.status === "accepted" && stored.acceptedNoteId) {
      return {
        suggestionId: suggestion.id,
        status: "accepted",
        createdNoteId: stored.acceptedNoteId,
      };
    }
    if (suggestion.status !== "pending") {
      throw new ConflictError("Only pending suggestions can be accepted.");
    }

    const payload = durablePayload(stored.suggestion);
    const title = edits.title ?? payload.proposedTitle;
    const bodyMarkdown = edits.bodyMarkdown ?? payload.bodyMarkdown;
    const tagNames = edits.tagNames ?? payload.suggestedTags;
    const approved = acceptDurableNoteSchema.safeParse({
      title,
      bodyMarkdown,
      tagNames,
    });
    if (!approved.success) {
      throw new ValidationError(approved.error.flatten().fieldErrors as unknown as Record<string, unknown>);
    }

    await assertSourceReferencesOwned(tx, userId, payload.sourceReferences);
    const note = await createNoteInTransaction(tx, userId, {
      title: approved.data.title!,
      contentMarkdown: approved.data.bodyMarkdown!,
      tagNames: approved.data.tagNames ?? [],
    });
    const now = new Date();
    const highlightIds = payload.sourceReferences
      .filter((reference) => reference.type === "highlight")
      .map((reference) => reference.id);
    const quickNoteIds = payload.sourceReferences
      .filter((reference) => reference.type === "quick_note")
      .map((reference) => reference.id);
    if (highlightIds.length > 0) {
      await tx
        .update(highlights)
        .set({ status: "processed", updatedAt: now })
        .where(
          and(
            eq(highlights.userId, userId),
            inArray(highlights.id, highlightIds),
            isNull(highlights.archivedAt),
          ),
        );
    }
    if (quickNoteIds.length > 0) {
      await tx
        .update(quickNotes)
        .set({ status: "processed", updatedAt: now })
        .where(
          and(
            eq(quickNotes.userId, userId),
            inArray(quickNotes.id, quickNoteIds),
            isNull(quickNotes.archivedAt),
          ),
        );
    }

    await tx
      .update(aiSuggestions)
      .set({
        status: "accepted",
        reviewedAt: now,
        payload: {
          ...stored.raw,
          acceptance: {
            noteId: note.id,
            title: approved.data.title,
            bodyMarkdown: approved.data.bodyMarkdown,
            tagNames: approved.data.tagNames ?? [],
          },
        },
      })
      .where(
        and(
          eq(aiSuggestions.id, suggestionId),
          eq(aiSuggestions.userId, userId),
          eq(aiSuggestions.status, "pending"),
        ),
      );

    return {
      suggestionId,
      status: "accepted",
      createdNoteId: note.id,
    };
  });
}

function relationPayload(suggestion: LocalSuggestion): RelationSuggestion {
  if (suggestion.type !== "relation") {
    throw new ValidationError({ type: "Only relation suggestions can be accepted." });
  }
  return suggestion;
}

async function acceptRelationSuggestion(
  userId: string,
  suggestionId: string,
): Promise<RelationAcceptanceResult> {
  const db = getDb();
  return db.transaction(async (tx) => {
    const suggestion = await getOwnedSuggestion(tx, userId, suggestionId, true);
    const stored = parseStoredPayload(suggestion.payload);
    if (suggestion.status === "accepted" && stored.acceptedRelationId) {
      return {
        suggestionId: suggestion.id,
        status: "accepted",
        relationId: stored.acceptedRelationId,
      };
    }
    if (suggestion.status !== "pending") {
      throw new ConflictError("Only pending suggestions can be accepted.");
    }

    const payload = relationPayload(stored.suggestion);
    await assertRelationNotesOwned(tx, userId, payload);
    const existing = await findRelationMemory(tx, userId, payload);
    if (existing?.status === "rejected") {
      throw new ConflictError("This Note relation was previously rejected.");
    }

    let relationId = existing?.id;
    if (!relationId) {
      const [created] = await tx
        .insert(noteRelations)
        .values({
          userId,
          sourceNoteId: payload.sourceNoteId,
          targetNoteId: payload.targetNoteId,
          relationType: payload.relationType,
          status: "confirmed",
          confidence: String(payload.confidence),
          reason: payload.reason,
          originKey: relationOriginKey(
            payload.relationType,
            payload.sourceNoteId,
            payload.targetNoteId,
          ),
        })
        .returning({ id: noteRelations.id });
      relationId = created?.id;
    }
    if (!relationId) {
      throw new Error("Relation confirmation did not return an ID.");
    }

    await tx
      .update(aiSuggestions)
      .set({
        status: "accepted",
        reviewedAt: new Date(),
        payload: {
          ...stored.raw,
          acceptance: {
            relationId,
            sourceNoteId: payload.sourceNoteId,
            targetNoteId: payload.targetNoteId,
          },
        },
      })
      .where(
        and(
          eq(aiSuggestions.id, suggestionId),
          eq(aiSuggestions.userId, userId),
          eq(aiSuggestions.status, "pending"),
        ),
      );

    return { suggestionId, status: "accepted", relationId };
  });
}

export async function acceptSuggestion(
  userId: string,
  suggestionId: string,
  input: unknown,
): Promise<SuggestionAcceptanceResult> {
  const suggestion = await getOwnedSuggestion(getDb(), userId, suggestionId);
  const stored = parseStoredPayload(suggestion.payload);
  return stored.suggestion.type === "relation"
    ? acceptRelationSuggestion(userId, suggestionId)
    : acceptDurableNote(userId, suggestionId, input);
}

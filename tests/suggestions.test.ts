import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { and, eq, inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { aiSuggestions, highlights, noteRelations, notes, quickNotes, users } from "../db/schema";
import {
  durableNoteSuggestionSchema,
  parseLocalSuggestion,
} from "../lib/local-agent/suggestions";
import { createHighlight } from "../lib/services/highlight-service";
import { createQuickNote } from "../lib/services/quick-note-service";
import { listInbox } from "../lib/services/inbox-service";
import { getNote, listNotes } from "../lib/services/note-service";
import { createNote } from "../lib/services/note-service";
import { pullKnowledge } from "../lib/services/local-agent-pull-service";
import { getLocalGraph } from "../lib/services/graph-service";
import {
  acceptDurableNote,
  acceptSuggestion,
  importSuggestions,
  listPendingSuggestions,
  setSuggestionStatus,
} from "../lib/services/suggestion-service";
import { readSuggestionFiles } from "../tools/knowledge-cli/suggestions";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000131";
const otherUserId = "00000000-0000-0000-0000-000000000132";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

const validDurable = (highlightId: string) => ({
  version: 1 as const,
  type: "durable_note" as const,
  id: "local-durable-1",
  sourceReferences: [{ type: "highlight" as const, id: highlightId }],
  proposedTitle: "中文消费结构",
  summary: "一个可复用的观察。",
  bodyMarkdown: "# 中文消费结构\n\n[[保留文本]]\n\n- 证据",
  suggestedTags: ["中文", "消费"],
});

const validRelation = (sourceNoteId: string, targetNoteId: string, id = "local-relation-1") => ({
  version: 1 as const,
  type: "relation" as const,
  id,
  sourceNoteId,
  targetNoteId,
  relationType: "semantic" as const,
  reason: "住房成本会具体影响年轻人的消费结构与选择。",
  confidence: 0.87,
});

describe("local suggestion schemas and workspace validation", () => {
  it("validates the two supported types and preserves Chinese Markdown", () => {
    const value = parseLocalSuggestion(validDurable("00000000-0000-4000-8000-000000000141"));
    assert.equal(value.type, "durable_note");
    assert.equal(value.bodyMarkdown, "# 中文消费结构\n\n[[保留文本]]\n\n- 证据");
    const relation = parseLocalSuggestion(validRelation(
      "00000000-0000-4000-8000-000000000141",
      "00000000-0000-4000-8000-000000000142",
    ));
    assert.equal(relation.type, "relation");
    assert.throws(() => parseLocalSuggestion({
      ...relation,
      sourceNoteId: relation.targetNoteId,
    }));
    assert.throws(() => parseLocalSuggestion({ ...relation, confidence: 1.1 }));
    assert.throws(() => parseLocalSuggestion({
      ...validDurable("00000000-0000-4000-8000-000000000141"),
      sourceReferences: [{ type: "highlight", id: "not-a-uuid" }],
    }));
    assert.throws(() => durableNoteSuggestionSchema.parse({
      ...validDurable("00000000-0000-4000-8000-000000000141"),
      bodyMarkdown: "",
    }));
  });

  it("validates local source references before push", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "knowledge-suggestions-"));
    await mkdir(path.join(workspace, "inbox"), { recursive: true });
    await mkdir(path.join(workspace, "suggestions"), { recursive: true });
    const highlightId = "00000000-0000-4000-8000-000000000141";
    await writeFile(
      path.join(workspace, "inbox", "highlights.json"),
      JSON.stringify([{ id: highlightId }]),
    );
    await writeFile(path.join(workspace, "inbox", "quick-notes.json"), "[]");
    await writeFile(
      path.join(workspace, "suggestions", "valid.json"),
      JSON.stringify(validDurable(highlightId)),
    );
    const files = await readSuggestionFiles(workspace);
    assert.equal(files.length, 1);
    assert.equal(files[0]?.suggestion.type, "durable_note");
    await writeFile(
      path.join(workspace, "suggestions", "invalid.json"),
      JSON.stringify(validDurable("00000000-0000-4000-8000-000000000142")),
    );
    await assert.rejects(() => readSuggestionFiles(workspace));
    assert.equal(await readFile(path.join(workspace, "suggestions", "valid.json"), "utf8") !== "", true);
    await rm(workspace, { recursive: true, force: true });
  });
});

describe("suggestion import and Web review", () => {
  let ownHighlightId = "";
  let otherHighlightId = "";
  let sourceNoteId = "";
  let targetNoteId = "";
  let thirdNoteId = "";
  let otherNoteId = "";

  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, email: "suggestions-primary@example.com" },
      { id: otherUserId, email: "suggestions-other@example.com" },
    ]);
    ownHighlightId = (await createHighlight(primaryUserId, {
      text: "Own evidence",
    })).id;
    otherHighlightId = (await createHighlight(otherUserId, {
      text: "Other evidence",
    })).id;
    sourceNoteId = (await createNote(primaryUserId, {
      title: "住房成本",
      contentMarkdown: "住房成本与消费结构。",
    })).id;
    targetNoteId = (await createNote(primaryUserId, {
      title: "消费结构",
      contentMarkdown: "年轻人的消费选择。",
    })).id;
    thirdNoteId = (await createNote(primaryUserId, {
      title: "收入预期",
      contentMarkdown: "收入预期影响储蓄。",
    })).id;
    otherNoteId = (await createNote(otherUserId, {
      title: "Other note",
      contentMarkdown: "Other user's note.",
    })).id;
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("imports pending suggestions idempotently without creating Notes", databaseTestOptions, async () => {
    const suggestion = validDurable(ownHighlightId);
    const first = await importSuggestions(primaryUserId, { suggestions: [suggestion] });
    assert.equal(first.counts.imported, 1);
    assert.equal((await listNotes(primaryUserId)).items.length, 3);
    const second = await importSuggestions(primaryUserId, { suggestions: [suggestion] });
    assert.equal(second.counts.alreadyPresent, 1);
    assert.equal((await listPendingSuggestions(primaryUserId)).length, 1);
    assert.equal((await listInbox(primaryUserId)).items.some((item) => item.type === "ai_suggestion"), true);
  });

  it("rejects cross-user and fabricated references before mutation", databaseTestOptions, async () => {
    const before = await getDb()
      .select({ id: aiSuggestions.id })
      .from(aiSuggestions)
      .where(eq(aiSuggestions.userId, primaryUserId));
    await assert.rejects(() => importSuggestions(primaryUserId, {
      suggestions: [validDurable(otherHighlightId)],
    }));
    await assert.rejects(() => importSuggestions(primaryUserId, {
      suggestions: [validDurable("00000000-0000-4000-8000-000000000149")],
    }));
    const after = await getDb()
      .select({ id: aiSuggestions.id })
      .from(aiSuggestions)
      .where(eq(aiSuggestions.userId, primaryUserId));
    assert.equal(after.length, before.length);
  });

  it("accepts an edited durable Note transactionally and is idempotent", databaseTestOptions, async () => {
    const quickNote = await createQuickNote(primaryUserId, { content: "原始速记" });
    const suggestion = {
      ...validDurable(ownHighlightId),
      id: "local-durable-accept",
      sourceReferences: [
        { type: "highlight" as const, id: ownHighlightId },
        { type: "quick_note" as const, id: quickNote.id },
      ],
    };
    const imported = await importSuggestions(primaryUserId, { suggestions: [suggestion] });
    const suggestionId = imported.items[0]!.suggestionId;
    const accepted = await acceptDurableNote(primaryUserId, suggestionId, {
      title: "编辑后的 Note",
      bodyMarkdown: "# 编辑后的 Note\n\n[[保留文本]]",
      tagNames: ["中文", "AI"],
    });
    const note = await getNote(primaryUserId, accepted.createdNoteId);
    assert.equal(note.title, "编辑后的 Note");
    assert.equal(note.contentMarkdown, "# 编辑后的 Note\n\n[[保留文本]]");
    assert.deepEqual(note.tags.map((tag) => tag.name).sort(), ["AI", "中文"]);
    const [highlight] = await getDb()
      .select({ text: highlights.text, status: highlights.status })
      .from(highlights)
      .where(and(eq(highlights.id, ownHighlightId), eq(highlights.userId, primaryUserId)));
    const [savedQuickNote] = await getDb()
      .select({ content: quickNotes.content, status: quickNotes.status })
      .from(quickNotes)
      .where(and(eq(quickNotes.id, quickNote.id), eq(quickNotes.userId, primaryUserId)));
    assert.deepEqual(highlight, { text: "Own evidence", status: "processed" });
    assert.deepEqual(savedQuickNote, { content: "原始速记", status: "processed" });

    const repeated = await acceptDurableNote(primaryUserId, suggestionId, {});
    assert.equal(repeated.createdNoteId, accepted.createdNoteId);
    const ownedNotes = await getDb()
      .select({ id: notes.id })
      .from(notes)
      .where(eq(notes.userId, primaryUserId));
    assert.equal(ownedNotes.filter((item) => item.id === accepted.createdNoteId).length, 1);
  });

  it("keeps review ownership and supports group ignore/reject", databaseTestOptions, async () => {
    const group = {
      version: 1 as const,
      type: "inbox_group" as const,
      id: "local-group-1",
      sourceReferences: [{ type: "highlight" as const, id: ownHighlightId }],
      proposedTitle: "整理分组",
      reason: "共同主题",
      themes: ["主题"],
    };
    const imported = await importSuggestions(primaryUserId, { suggestions: [group] });
    const suggestionId = imported.items[0]!.suggestionId;
    await assert.rejects(() => setSuggestionStatus(otherUserId, suggestionId, "ignored"));
    const ignored = await setSuggestionStatus(primaryUserId, suggestionId, "ignored");
    assert.deepEqual(ignored, { id: suggestionId, status: "ignored" });
  });

  it("imports, confirms, and idempotently re-confirms a relation", databaseTestOptions, async () => {
    const suggestion = validRelation(sourceNoteId, targetNoteId, "local-relation-confirm");
    const imported = await importSuggestions(primaryUserId, { suggestions: [suggestion] });
    const suggestionId = imported.items[0]!.suggestionId;
    const pending = await getDb()
      .select({ status: aiSuggestions.status })
      .from(aiSuggestions)
      .where(eq(aiSuggestions.id, suggestionId));
    assert.equal(pending[0]?.status, "pending");
    const accepted = await acceptSuggestion(primaryUserId, suggestionId, {});
    if (!("relationId" in accepted)) throw new Error("Expected a relation acceptance.");
    const relations = await getDb()
      .select()
      .from(noteRelations)
      .where(eq(noteRelations.id, accepted.relationId));
    assert.equal(relations[0]?.status, "confirmed");
    const graph = await getLocalGraph(primaryUserId, sourceNoteId);
    assert.equal(graph.edges.some((edge) => edge.id === accepted.relationId), true);
    const repeated = await acceptSuggestion(primaryUserId, suggestionId, {});
    assert.deepEqual(repeated, accepted);
    assert.equal((await importSuggestions(primaryUserId, { suggestions: [suggestion] })).counts.alreadyPresent, 1);
  });

  it("rejects cross-user, confirmed, and previously rejected relations", databaseTestOptions, async () => {
    await assert.rejects(() => importSuggestions(primaryUserId, {
      suggestions: [validRelation(sourceNoteId, otherNoteId, "local-relation-cross-user")],
    }));
    await assert.rejects(() => importSuggestions(primaryUserId, {
      suggestions: [validRelation(sourceNoteId, "00000000-0000-4000-8000-000000000149", "local-relation-fabricated")],
    }));

    const rejected = validRelation(sourceNoteId, thirdNoteId, "local-relation-rejected");
    const imported = await importSuggestions(primaryUserId, { suggestions: [rejected] });
    await setSuggestionStatus(primaryUserId, imported.items[0]!.suggestionId, "rejected");
    const relationRows = await getDb()
      .select({ status: noteRelations.status })
      .from(noteRelations)
      .where(
        and(
          eq(noteRelations.userId, primaryUserId),
          eq(noteRelations.relationType, "semantic"),
        ),
      );
    const memory = relationRows.filter((row) => row.status === "rejected");
    assert.deepEqual(memory.map((row) => row.status), ["rejected"]);
    const pulled = await pullKnowledge(primaryUserId, "notes");
    assert.equal(pulled.relations.some((relation) => relation.status === "rejected"), true);
    await assert.rejects(() => importSuggestions(primaryUserId, {
      suggestions: [validRelation(sourceNoteId, thirdNoteId, "local-relation-rejected-again")],
    }));
    const confirmed = await getDb()
      .select({ status: noteRelations.status })
      .from(noteRelations)
      .where(and(
        eq(noteRelations.sourceNoteId, sourceNoteId),
        eq(noteRelations.targetNoteId, thirdNoteId),
      ));
    assert.equal(confirmed.some((row) => row.status === "confirmed"), false);
  });
});

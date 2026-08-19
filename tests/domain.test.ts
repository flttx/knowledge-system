import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { users } from "../db/schema";
import { createHighlight, archiveHighlight, listHighlights } from "../lib/services/highlight-service";
import { listInbox } from "../lib/services/inbox-service";
import { archiveQuickNote, createQuickNote } from "../lib/services/quick-note-service";
import { archiveSource, createSource } from "../lib/services/source-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000011";
const otherUserId = "00000000-0000-0000-0000-000000000012";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  const db = getDb();
  await db.delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("core domain services", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    const db = getDb();
    await db.insert(users).values([
      { id: primaryUserId, email: "batch-b-primary@example.com" },
      { id: otherUserId, email: "batch-b-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("validates source input and keeps source ownership scoped", databaseTestOptions, async () => {
    await assert.rejects(() => createSource(primaryUserId, { title: "", sourceType: "article" }));
    const source = await createSource(primaryUserId, {
      title: "Owned source",
      sourceType: "article",
    });
    const archivedSource = await archiveSource(primaryUserId, source.id);
    assert.ok(archivedSource.archivedAt);
    await assert.rejects(() => createHighlight(otherUserId, {
      text: "Cross-user association",
      sourceId: source.id,
    }));
  });

  it("creates highlights with and without sources and defaults them to inbox", databaseTestOptions, async () => {
    const source = await createSource(primaryUserId, {
      title: "Highlight source",
      sourceType: "book",
    });
    const withoutSource = await createHighlight(primaryUserId, { text: "Standalone highlight" });
    const withSource = await createHighlight(primaryUserId, {
      text: "Associated highlight",
      sourceId: source.id,
      page: 12,
      location: "Chapter 2",
      personalComment: "Review later",
    });

    assert.equal(withoutSource.status, "inbox");
    assert.equal(withoutSource.sourceId, null);
    assert.equal(withSource.status, "inbox");
    assert.equal(withSource.sourceId, source.id);
    assert.equal(withSource.text, "Associated highlight");
  });

  it("creates quick notes with inbox status", databaseTestOptions, async () => {
    const quickNote = await createQuickNote(primaryUserId, { content: "A quick thought" });
    assert.equal(quickNote.status, "inbox");
    assert.equal(quickNote.sourceId, null);
  });

  it("archives items and excludes archived highlights from the active list", databaseTestOptions, async () => {
    const highlight = await createHighlight(primaryUserId, { text: "Archive me" });
    const quickNote = await createQuickNote(primaryUserId, { content: "Archive this too" });
    const archivedHighlight = await archiveHighlight(primaryUserId, highlight.id);
    const archivedQuickNote = await archiveQuickNote(primaryUserId, quickNote.id);

    assert.equal(archivedHighlight.status, "archived");
    assert.ok(archivedHighlight.archivedAt);
    assert.equal(archivedQuickNote.status, "archived");
    assert.ok(archivedQuickNote.archivedAt);
    const activeHighlights = await listHighlights(primaryUserId);
    assert.equal(activeHighlights.items.some((item) => item.id === highlight.id), false);
  });

  it("derives inbox items only for the current user", databaseTestOptions, async () => {
    const ownHighlight = await createHighlight(primaryUserId, { text: "Own inbox item" });
    const otherQuickNote = await createQuickNote(otherUserId, { content: "Other inbox item" });
    const inbox = await listInbox(primaryUserId);

    assert.equal(inbox.items.some((item) => item.id === ownHighlight.id), true);
    assert.equal(inbox.items.some((item) => item.id === otherQuickNote.id), false);
    assert.equal(inbox.items.every((item) => item.data.status === "inbox"), true);
  });
});

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { users } from "../db/schema";
import { createHighlight } from "../lib/services/highlight-service";
import { listInbox } from "../lib/services/inbox-service";
import { createQuickNote } from "../lib/services/quick-note-service";
import { createSource } from "../lib/services/source-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000071";
const otherUserId = "00000000-0000-0000-0000-000000000072";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("tablet quick capture", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, email: "capture-primary@example.com" },
      { id: otherUserId, email: "capture-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("captures Highlights with and without a Source and keeps Inbox status", databaseTestOptions, async () => {
    const source = await createSource(primaryUserId, {
      title: "Reading source",
      publication: "Magazine",
      sourceType: "magazine",
    });
    const withSource = await createHighlight(primaryUserId, {
      sourceId: source.id,
      text: "A captured excerpt",
      personalComment: "This changes how I see the topic.",
    });
    const withoutSource = await createHighlight(primaryUserId, {
      text: "A second excerpt",
    });

    assert.equal(withSource.status, "inbox");
    assert.equal(withSource.personalComment, "This changes how I see the topic.");
    assert.equal(withoutSource.sourceId, null);

    const inbox = await listInbox(primaryUserId, 20);
    assert.ok(inbox.items.some((item) => item.id === withSource.id));
    assert.ok(inbox.items.some((item) => item.id === withoutSource.id));
  });

  it("captures QuickNotes repeatedly with the same Source and validates ownership/content", databaseTestOptions, async () => {
    const source = await createSource(primaryUserId, {
      title: "Repeated reading source",
      sourceType: "article",
    });
    const first = await createQuickNote(primaryUserId, {
      sourceId: source.id,
      content: "First thought",
    });
    const second = await createQuickNote(primaryUserId, {
      sourceId: source.id,
      content: "Second thought",
    });
    assert.equal(first.status, "inbox");
    assert.equal(second.status, "inbox");

    const otherSource = await createSource(otherUserId, {
      title: "Other user's source",
      sourceType: "article",
    });
    await assert.rejects(
      () => createHighlight(primaryUserId, { sourceId: otherSource.id, text: "No access" }),
    );
    await assert.rejects(() => createQuickNote(primaryUserId, { content: "   " }));
  });
});

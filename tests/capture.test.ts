import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { attachments, users } from "../db/schema";
import { createHighlight } from "../lib/services/highlight-service";
import { listInbox } from "../lib/services/inbox-service";
import { createQuickNote } from "../lib/services/quick-note-service";
import {
  archiveScreenshot,
  createScreenshot,
  listScreenshots,
  restoreScreenshot,
  updateScreenshot,
} from "../lib/services/screenshot-service";
import { createSource } from "../lib/services/source-service";
import { createNote } from "../lib/services/note-service";

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

  it("captures screenshots with private attachment ownership, Inbox lifecycle, and Note links", databaseTestOptions, async () => {
    const source = await createSource(primaryUserId, { title: "Screenshot source", sourceType: "pdf" });
    const note = await createNote(primaryUserId, {
      title: "Screenshot note",
      contentMarkdown: "",
      tagNames: [],
    });
    const [attachment] = await getDb().insert(attachments).values({
      userId: primaryUserId,
      storageKey: "screenshots/test.png",
      fileName: "test.png",
      mimeType: "image/png",
      sizeBytes: 128,
    }).returning();
    assert.ok(attachment);

    const screenshot = await createScreenshot(primaryUserId, {
      attachmentId: attachment.id,
      sourceId: source.id,
      noteId: note.id,
      page: "42",
      location: "Chapter 3",
      annotation: "Keep this visual context.",
    });
    assert.equal(screenshot.status, "inbox");
    assert.equal(screenshot.page, "42");
    assert.equal(screenshot.annotation, "Keep this visual context.");
    assert.equal(screenshot.noteId, note.id);
    assert.ok((await listInbox(primaryUserId, 20)).items.some((item) => item.type === "screenshot" && item.id === screenshot.id));

    const updated = await updateScreenshot(primaryUserId, screenshot.id, {
      annotation: "Updated annotation",
      page: "43",
      location: "Figure 2",
      sourceId: null,
      noteId: null,
    });
    assert.equal(updated.annotation, "Updated annotation");
    assert.equal(updated.sourceId, null);
    assert.equal(updated.noteId, null);

    const archived = await archiveScreenshot(primaryUserId, screenshot.id);
    assert.equal(archived.status, "archived");
    assert.equal((await listScreenshots(primaryUserId)).items.some((item) => item.id === screenshot.id), false);
    const restored = await restoreScreenshot(primaryUserId, screenshot.id);
    assert.equal(restored.status, "inbox");

    const [otherAttachment] = await getDb().insert(attachments).values({
      userId: otherUserId,
      storageKey: "screenshots/other.png",
      fileName: "other.png",
      mimeType: "image/png",
      sizeBytes: 128,
    }).returning();
    assert.ok(otherAttachment);
    await assert.rejects(() => createScreenshot(primaryUserId, { attachmentId: otherAttachment.id }));
    await assert.rejects(() => createScreenshot(primaryUserId, { attachmentId: attachment.id, sourceId: "00000000-0000-0000-0000-000000000099" }));
    await assert.rejects(() => createScreenshot(primaryUserId, { attachmentId: attachment.id, noteId: "00000000-0000-0000-0000-000000000099" }));

    const [badAttachment] = await getDb().insert(attachments).values({
      userId: primaryUserId,
      storageKey: "screenshots/test.gif",
      fileName: "test.gif",
      mimeType: "image/gif",
      sizeBytes: 128,
    }).returning();
    assert.ok(badAttachment);
    await assert.rejects(() => createScreenshot(primaryUserId, { attachmentId: badAttachment.id }));
  });
});

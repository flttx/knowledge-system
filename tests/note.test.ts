import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { users } from "../db/schema";
import {
  archiveNote,
  attachTag,
  createNote,
  detachTag,
  getNote,
  listNotes,
  listTags,
  restoreNote,
  updateNote,
} from "../lib/services/note-service";
import {
  isDraftNewerThan,
  noteDraftKey,
  parseNoteDraft,
  serializeNoteDraft,
} from "../lib/notes/draft";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000021";
const otherUserId = "00000000-0000-0000-0000-000000000022";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  const db = getDb();
  await db.delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("durable Markdown notes and tags", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    const db = getDb();
    await db.insert(users).values([
      { id: primaryUserId, email: "batch-c-primary@example.com" },
      { id: otherUserId, email: "batch-c-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("creates and round-trips canonical Markdown content", databaseTestOptions, async () => {
    const markdown = "# 标题\n\n[[保留原样]]\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";
    const note = await createNote(primaryUserId, {
      title: "中文知识笔记",
      contentMarkdown: markdown,
      tagNames: [" 阅读 ", "中文"],
    });

    assert.equal(note.contentMarkdown, markdown);
    assert.equal(note.tags.map((tag) => tag.name).join(","), "阅读,中文");
    assert.equal(note.slug, "中文知识笔记");
  });

  it("edits, archives, restores, and enforces note ownership", databaseTestOptions, async () => {
    const note = await createNote(primaryUserId, { title: "可归档笔记" });
    const edited = await updateNote(primaryUserId, note.id, {
      title: "更新后的标题",
      contentMarkdown: "- 保持 Markdown\n- 不做重写",
    });
    assert.equal(edited.title, "更新后的标题");
    assert.equal(edited.contentMarkdown, "- 保持 Markdown\n- 不做重写");
    assert.equal(edited.slug, note.slug);

    await assert.rejects(() => getNote(otherUserId, note.id));
    await archiveNote(primaryUserId, note.id);
    const archived = await getNote(primaryUserId, note.id);
    assert.ok(archived.archivedAt);
    const active = await listNotes(primaryUserId);
    assert.equal(active.items.some((item) => item.id === note.id), false);
    const restored = await restoreNote(primaryUserId, note.id);
    assert.equal(restored.archivedAt, null);
  });

  it("normalizes tags, avoids duplicates, attaches, detaches, and filters", databaseTestOptions, async () => {
    const first = await createNote(primaryUserId, {
      title: "标签笔记一",
      tagNames: [" AI ", "ai", "读书"],
    });
    const second = await createNote(primaryUserId, {
      title: "标签笔记二",
      tagNames: ["AI"],
    });
    assert.deepEqual(first.tags.map((tag) => tag.name), ["ai", "读书"]);

    const tags = await listTags(primaryUserId, { q: "AI" });
    assert.equal(tags.length, 1);
    assert.equal(tags[0]?.noteCount, 2);

    const attached = await attachTag(primaryUserId, second.id, { name: "中文标签" });
    assert.equal(attached.tags.some((tag) => tag.name === "中文标签"), true);
    const chineseTag = attached.tags.find((tag) => tag.name === "中文标签");
    assert.ok(chineseTag);
    const detached = await detachTag(primaryUserId, second.id, chineseTag.id);
    assert.equal(detached.tags.some((tag) => tag.name === "中文标签"), false);

    const filtered = await listNotes(primaryUserId, { tag: " ai " });
    assert.equal(filtered.items.some((item) => item.id === first.id), true);
    assert.equal(filtered.items.some((item) => item.id === second.id), true);
  });

  it("preserves temporary drafts for failed-save recovery", () => {
    const draft = {
      title: "未同步标题",
      contentMarkdown: "[[未同步链接]]\n\n正文",
      tagNames: ["中文"],
      savedAt: "2026-08-18T10:00:00.000Z",
    };
    const serialized = serializeNoteDraft(draft);
    assert.deepEqual(parseNoteDraft(serialized), draft);
    assert.equal(isDraftNewerThan(draft, "2026-08-18T09:59:00.000Z"), true);
    assert.equal(noteDraftKey("note-1"), "knowledge-system:note-draft:note-1");
  });
});

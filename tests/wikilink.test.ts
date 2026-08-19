import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { and, eq, inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { noteRelations, users } from "../db/schema";
import { getBacklinks } from "../lib/services/wikilink-service";
import { createNote, updateNote } from "../lib/services/note-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000031";
const otherUserId = "00000000-0000-0000-0000-000000000032";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("wikilink relations and backlinks", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, email: "batch-d-primary@example.com" },
      { id: otherUserId, email: "batch-d-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("synchronizes unique wikilink relations and preserves manual relations", databaseTestOptions, async () => {
    const targetB = await createNote(primaryUserId, { title: "目标 B" });
    const targetC = await createNote(primaryUserId, { title: "目标 C" });
    const source = await createNote(primaryUserId, {
      title: "来源笔记",
      contentMarkdown: "[[目标 B]] and [[目标 B|别名]]",
    });
    const db = getDb();

    let relations = await db.select().from(noteRelations).where(and(
      eq(noteRelations.userId, primaryUserId),
      eq(noteRelations.sourceNoteId, source.id),
    ));
    assert.deepEqual(relations.map((relation) => relation.targetNoteId), [targetB.id]);
    assert.equal(relations[0]?.relationType, "wikilink");
    assert.equal(relations[0]?.status, "confirmed");

    await updateNote(primaryUserId, source.id, { contentMarkdown: "[[目标 C]]" });
    relations = await db.select().from(noteRelations).where(and(
      eq(noteRelations.userId, primaryUserId),
      eq(noteRelations.sourceNoteId, source.id),
    ));
    assert.deepEqual(relations.map((relation) => relation.targetNoteId), [targetC.id]);

    await db.insert(noteRelations).values({
      userId: primaryUserId,
      sourceNoteId: source.id,
      targetNoteId: targetB.id,
      relationType: "manual",
      status: "confirmed",
      originKey: "manual-test",
    });
    await updateNote(primaryUserId, source.id, { contentMarkdown: "没有链接" });
    relations = await db.select().from(noteRelations).where(and(
      eq(noteRelations.userId, primaryUserId),
      eq(noteRelations.sourceNoteId, source.id),
    ));
    assert.deepEqual(relations.map((relation) => relation.relationType), ["manual"]);
  });

  it("rejects ambiguous, cross-user, and self wikilinks", databaseTestOptions, async () => {
    await createNote(primaryUserId, { title: "重复目标" });
    await createNote(primaryUserId, { title: "重复目标" });
    const ambiguousSource = await createNote(primaryUserId, {
      title: "歧义来源",
      contentMarkdown: "[[重复目标]]",
    });
    const privateTarget = await createNote(otherUserId, { title: "私有目标" });
    const crossUserSource = await createNote(primaryUserId, {
      title: "跨用户来源",
      contentMarkdown: "[[私有目标]]",
    });
    const selfSource = await createNote(primaryUserId, { title: "自链接" });
    await updateNote(primaryUserId, selfSource.id, { contentMarkdown: "[[自链接]]" });

    const rows = await getDb().select().from(noteRelations).where(
      inArray(noteRelations.sourceNoteId, [ambiguousSource.id, crossUserSource.id, selfSource.id]),
    );
    assert.equal(rows.length, 0);
    assert.ok(privateTarget.id);
  });

  it("returns only confirmed, user-scoped incoming backlinks", databaseTestOptions, async () => {
    const target = await createNote(primaryUserId, { title: "Backlink Target" });
    const source = await createNote(primaryUserId, {
      title: "Backlink Source",
      contentMarkdown: "See [[Backlink Target]] here",
    });
    const manualSource = await createNote(primaryUserId, { title: "Manual Source" });
    const suggestedSource = await createNote(primaryUserId, { title: "Suggested Source" });
    const rejectedSource = await createNote(primaryUserId, { title: "Rejected Source" });
    const db = getDb();
    await db.insert(noteRelations).values([
      {
        userId: primaryUserId,
        sourceNoteId: manualSource.id,
        targetNoteId: target.id,
        relationType: "manual",
        status: "confirmed",
        originKey: "manual-backlink",
      },
      {
        userId: primaryUserId,
        sourceNoteId: suggestedSource.id,
        targetNoteId: target.id,
        relationType: "ai_suggested",
        status: "suggested",
        originKey: "suggested-backlink",
      },
      {
        userId: primaryUserId,
        sourceNoteId: rejectedSource.id,
        targetNoteId: target.id,
        relationType: "ai_suggested",
        status: "rejected",
        originKey: "rejected-backlink",
      },
    ]);

    let backlinks = await getBacklinks(primaryUserId, target.id);
    assert.deepEqual(backlinks.map((backlink) => backlink.noteId).sort(), [manualSource.id, source.id].sort());

    await updateNote(primaryUserId, source.id, { contentMarkdown: "link removed" });
    backlinks = await getBacklinks(primaryUserId, target.id);
    assert.deepEqual(backlinks.map((backlink) => backlink.noteId), [manualSource.id]);
    await assert.rejects(() => getBacklinks(otherUserId, target.id));
  });
});

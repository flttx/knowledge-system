import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { Buffer } from "node:buffer";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { noteRelations, users } from "../db/schema";
import { createKnowledgeArchive, sanitizeExportFileName } from "../lib/services/export-service";
import { archiveNote, createNote } from "../lib/services/note-service";
import { createHighlight } from "../lib/services/highlight-service";
import { createQuickNote } from "../lib/services/quick-note-service";
import { createSource } from "../lib/services/source-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000081";
const otherUserId = "00000000-0000-0000-0000-000000000082";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

function readStoredZip(bytes: Uint8Array): Map<string, string> {
  const buffer = Buffer.from(bytes);
  const entries = new Map<string, string>();
  let offset = 0;

  while (offset + 4 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const compression = buffer.readUInt16LE(offset + 8);
    const size = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    assert.equal(compression, 0);
    entries.set(
      buffer.subarray(nameStart, nameStart + nameLength).toString("utf8"),
      buffer.subarray(dataStart, dataStart + size).toString("utf8"),
    );
    offset = dataStart + size;
  }

  return entries;
}

describe("knowledge archive export", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, email: "export-primary@example.com" },
      { id: otherUserId, email: "export-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("sanitizes readable filenames without using titles as identity", () => {
    assert.equal(sanitizeExportFileName("消费 / 趋势: 2026?"), "消费 - 趋势- 2026-");
    assert.equal(sanitizeExportFileName("CON"), "CON-note");
    assert.equal(sanitizeExportFileName("***"), "untitled-note");
  });

  it("exports current-user Notes, source data, statuses, relations, and manifest", databaseTestOptions, async () => {
    const target = await createNote(primaryUserId, { title: "目标 Note" });
    const markdown = "# 中文标题\n\n[[目标 Note]]\n\n- [ ] 保留任务\n\n| A | B |\n| --- | --- |\n| 1 | 2 |";
    const first = await createNote(primaryUserId, {
      title: "Collision / Note",
      contentMarkdown: markdown,
      tagNames: ["消费", "AI"],
    });
    await createNote(primaryUserId, {
      title: "Collision / Note",
      contentMarkdown: "第二个同名 Note",
    });
    const archived = await createNote(primaryUserId, {
      title: "Archived: Note",
      contentMarkdown: "归档内容 [[目标 Note]]",
    });
    await archiveNote(primaryUserId, archived.id);

    const source = await createSource(primaryUserId, {
      title: "中文来源",
      publication: "示例出版物",
      sourceType: "article",
    });
    const highlight = await createHighlight(primaryUserId, {
      sourceId: source.id,
      text: "原始摘录不可改写",
      page: 12,
      location: "第 3 段",
      personalComment: "保留我的想法",
    });
    const quickNote = await createQuickNote(primaryUserId, {
      sourceId: source.id,
      content: "一条速记",
    });
    await getDb().insert(noteRelations).values({
      userId: primaryUserId,
      sourceNoteId: first.id,
      targetNoteId: target.id,
      relationType: "ai_suggested",
      status: "rejected",
      confidence: "0.12",
      reason: "用户拒绝",
      originKey: "export-test-rejected",
    });

    await createNote(otherUserId, { title: "PRIVATE NOTE", contentMarkdown: "PRIVATE BODY" });
    await createSource(otherUserId, { title: "PRIVATE SOURCE", sourceType: "article" });

    const archive = await createKnowledgeArchive(primaryUserId);
    const files = readStoredZip(archive.bytes);
    const markdownFiles = [...files.keys()].filter((file) => file.endsWith(".md"));
    const noteFile = [...files.entries()].find(([, content]) => content.endsWith(markdown));
    const archivedFile = [...files.keys()].find((file) => file.startsWith("knowledge-export/Archive/"));
    const collisionFiles = markdownFiles.filter((file) => file.includes("Collision - Note"));
    assert.equal(markdownFiles.length, 4);
    assert.ok(noteFile);
    assert.ok(collisionFiles.includes(noteFile[0]));
    assert.equal(collisionFiles.length, 2);
    assert.ok(collisionFiles.some((file) => file.endsWith("-2.md")));
    assert.ok(archivedFile);
    assert.ok(noteFile[1].includes(`id: ${first.id}`));
    assert.ok(noteFile[1].includes('  - "消费"'));
    assert.ok(noteFile[1].includes("[[目标 Note]]"));

    const sources = JSON.parse(files.get("knowledge-export/Sources/sources.json") ?? "null") as { id: string; title: string }[];
    const highlights = JSON.parse(files.get("knowledge-export/Highlights/highlights.json") ?? "null") as { id: string; text: string }[];
    const quickNotes = JSON.parse(files.get("knowledge-export/QuickNotes/quick-notes.json") ?? "null") as { id: string; content: string }[];
    const relations = JSON.parse(files.get("knowledge-export/relations.json") ?? "null") as { status: string; reason: string | null }[];
    const attachments = JSON.parse(files.get("knowledge-export/Assets/attachments.json") ?? "null") as unknown[];
    const manifest = JSON.parse(files.get("knowledge-export/manifest.json") ?? "null") as { counts: Record<string, number> };

    assert.deepEqual(sources.map((item) => item.id), [source.id]);
    assert.deepEqual(highlights.map((item) => item.id), [highlight.id]);
    assert.deepEqual(quickNotes.map((item) => item.id), [quickNote.id]);
    assert.ok(relations.some((relation) => relation.status === "rejected" && relation.reason === "用户拒绝"));
    assert.deepEqual(attachments, []);
    assert.deepEqual(manifest.counts, {
      notes: 4,
      sources: 1,
      highlights: 1,
      quickNotes: 1,
      relations: 3,
      attachments: 0,
    });
    assert.equal(archive.manifest.counts.notes, 4);
    assert.equal(files.has("knowledge-export/manifest.json"), true);
    assert.equal([...files.values()].some((content) => content.includes("PRIVATE BODY")), false);

    const inspectionPath = process.env.EXPORT_INSPECTION_PATH;
    if (inspectionPath) {
      await mkdir(dirname(inspectionPath), { recursive: true });
      await writeFile(inspectionPath, archive.bytes);
    }
  });
});

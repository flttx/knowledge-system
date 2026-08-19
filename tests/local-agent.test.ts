import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { users } from "../db/schema";
import { getLocalAgentUser } from "../lib/auth/local-agent";
import type { LocalAgentPullResponse } from "../lib/local-agent/types";
import { pullKnowledge } from "../lib/services/local-agent-pull-service";
import { createHighlight } from "../lib/services/highlight-service";
import { createNote } from "../lib/services/note-service";
import { createQuickNote } from "../lib/services/quick-note-service";
import { createSource } from "../lib/services/source-service";
import { writeWorkspace } from "../tools/knowledge-cli/workspace";
import { createLocalAgentToken } from "../lib/services/local-agent-token-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000091";
const otherUserId = "00000000-0000-0000-0000-000000000092";
const databaseTestOptions = { skip: !databaseUrl };
let token = "";

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("local agent authentication and pull", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, username: "local-agent-primary", email: "local-agent-primary@example.com" },
      { id: otherUserId, username: "local-agent-other", email: "local-agent-other@example.com" },
    ]);
    token = (await createLocalAgentToken(primaryUserId, "test device")).token;
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("authenticates a user-owned token and rejects another token", databaseTestOptions, async () => {
    const valid = await getLocalAgentUser(
      new Request("http://localhost/api/local-agent/status", {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    assert.deepEqual(valid, { id: primaryUserId });

    const invalidToken = await getLocalAgentUser(
      new Request("http://localhost/api/local-agent/status", {
        headers: { authorization: "Bearer wrong-token" },
      }),
    );
    assert.equal(invalidToken, null);

    const otherToken = (await createLocalAgentToken(otherUserId, "other device")).token;
    const other = await getLocalAgentUser(
      new Request("http://localhost/api/local-agent/status", {
        headers: { authorization: `Bearer ${otherToken}` },
      }),
    );
    assert.deepEqual(other, { id: otherUserId });
  });

  it("pulls only owned Inbox data and preserves Note Markdown and tags", databaseTestOptions, async () => {
    const source = await createSource(primaryUserId, {
      title: "本人的来源",
      sourceType: "article",
    });
    const otherSource = await createSource(otherUserId, {
      title: "他人的来源",
      sourceType: "article",
    });
    const ownHighlight = await createHighlight(primaryUserId, {
      text: "自己的摘录",
      sourceId: source.id,
    });
    await createHighlight(otherUserId, { text: "他人的摘录", sourceId: otherSource.id });
    await createQuickNote(otherUserId, { content: "他人的速记" });
    const markdown = "# 原文\n\n[[保留文本]]\n\n| A | B |\n| --- | --- |";
    const note = await createNote(primaryUserId, {
      title: "本人的 Note",
      contentMarkdown: markdown,
      tagNames: [" 中文标签 ", "AI"],
    });

    const inbox = await pullKnowledge(primaryUserId, "inbox");
    assert.deepEqual(inbox.inbox.highlights.map((item) => item.id), [ownHighlight.id]);
    assert.equal(inbox.inbox.quickNotes.length, 0);
    assert.deepEqual(inbox.sources.map((item) => item.id), [source.id]);

    const notes = await pullKnowledge(primaryUserId, "notes");
    assert.equal(notes.inbox.highlights.length, 0);
    assert.equal(notes.notes[0]?.id, note.id);
    assert.equal(notes.notes[0]?.contentMarkdown, markdown);
    assert.deepEqual(notes.notes[0]?.tags, ["AI", "中文标签"]);
    assert.equal(notes.sources.length, 0);
  });
});

describe("local knowledge workspace", () => {
  it("writes Markdown bytes unchanged and removes stale selected Notes", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "knowledge-workspace-"));
    const firstId = "00000000-0000-0000-0000-000000000111";
    const secondId = "00000000-0000-0000-0000-000000000112";
    const firstContent = "# 标题\n\n[[不要改写]]\n\n- [ ] task";
    const base = {
      version: 1 as const,
      generatedAt: "2026-08-18T00:00:00.000Z",
      inbox: { highlights: [], quickNotes: [] },
      sources: [],
      relations: [],
      counts: { highlights: 0, quickNotes: 0, sources: 0, notes: 1, relations: 0 },
    };
    const first: LocalAgentPullResponse = {
      ...base,
      scope: "all",
      notes: [
        {
          id: firstId,
          title: "第一篇",
          slug: "first",
          contentMarkdown: firstContent,
          tags: ["中文"],
          createdAt: "2026-08-18T00:00:00.000Z",
          updatedAt: "2026-08-18T00:00:00.000Z",
          archivedAt: null,
        },
      ],
    };
    await writeWorkspace(workspace, "https://example.test", first);
    assert.equal(await readFile(path.join(workspace, "notes", `${firstId}.md`), "utf8"), firstContent);

    const second: LocalAgentPullResponse = {
      ...base,
      scope: "notes",
      notes: [
        {
          ...first.notes[0]!,
          id: secondId,
          contentMarkdown: "## 第二篇",
        },
      ],
    };
    await writeWorkspace(workspace, "https://example.test", second);
    await assert.rejects(() => readFile(path.join(workspace, "notes", `${firstId}.md`), "utf8"));
    assert.equal(await readFile(path.join(workspace, "notes", `${secondId}.md`), "utf8"), "## 第二篇");
    await rm(workspace, { recursive: true, force: true });
  });
});

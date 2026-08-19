import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { users } from "../db/schema";
import { createHighlight } from "../lib/services/highlight-service";
import { archiveNote, createNote } from "../lib/services/note-service";
import { search, searchNoteTitles } from "../lib/services/search-service";
import { archiveSource, createSource } from "../lib/services/source-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000061";
const otherUserId = "00000000-0000-0000-0000-000000000062";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("title and lexical search", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, email: "search-primary@example.com" },
      { id: otherUserId, email: "search-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("ranks exact and prefix title matches, preserves Chinese, and scopes active Notes", databaseTestOptions, async () => {
    const exact = await createNote(primaryUserId, {
      title: "\u6d88\u8d39\u8d8b\u52bf",
      contentMarkdown: "Exact note body",
      tagNames: ["\u6d88\u8d39"],
    });
    const prefix = await createNote(primaryUserId, {
      title: "\u6d88\u8d39\u8d8b\u52bf\u53d8\u5316",
      contentMarkdown: "Prefix note body",
    });
    await createNote(primaryUserId, {
      title: "\u5e74\u8f7b\u4eba\u7684\u6d88\u8d39",
      contentMarkdown: "Partial note body",
    });
    const archived = await createNote(primaryUserId, {
      title: "\u6d88\u8d39\u8d8b\u52bf\u6863\u6848",
      contentMarkdown: "Archived body",
    });
    await archiveNote(primaryUserId, archived.id);
    await createNote(otherUserId, {
      title: "\u6d88\u8d39\u8d8b\u52bf",
      contentMarkdown: "Other user body",
    });

    const exactMatches = await searchNoteTitles(primaryUserId, "\u6d88\u8d39\u8d8b\u52bf");
    assert.equal(exactMatches[0]?.id, exact.id);
    assert.deepEqual(exactMatches[0]?.tags, ["\u6d88\u8d39"]);
    assert.ok(exactMatches.every((item) => item.id !== archived.id));

    const prefixMatches = await searchNoteTitles(primaryUserId, "\u6d88\u8d39\u8d8b\u52bf\u53d8");
    assert.equal(prefixMatches[0]?.id, prefix.id);
    const partialMatches = await searchNoteTitles(primaryUserId, "\u8d39");
    assert.ok(partialMatches.some((item) => item.id === exact.id));
    assert.ok(partialMatches.some((item) => item.title === "\u5e74\u8f7b\u4eba\u7684\u6d88\u8d39"));
    assert.ok(partialMatches.every((item) => !Object.hasOwn(item, "contentMarkdown")));
  });

  it("searches Note content, Source fields, Highlight fields, and enforces filters", databaseTestOptions, async () => {
    const note = await createNote(primaryUserId, {
      title: "Lexical reading",
      contentMarkdown: "PostgreSQL supports mixed English and \u6d88\u8d39 evidence.",
    });
    const source = await createSource(primaryUserId, {
      title: "Reading source",
      publication: "\u6d88\u8d39\u7814\u7a76",
      author: "Alice",
      sourceType: "article",
    });
    const highlight = await createHighlight(primaryUserId, {
      sourceId: source.id,
      text: "Mixed English \u6d88\u8d39\u8bc1\u636e",
      personalComment: "Important personal observation",
    });
    const archivedSource = await createSource(primaryUserId, {
      title: "Archived source",
      sourceType: "article",
    });
    await archiveSource(primaryUserId, archivedSource.id);
    await createSource(otherUserId, {
      title: "Reading source",
      publication: "\u6d88\u8d39\u7814\u7a76",
      sourceType: "article",
    });

    assert.equal((await search(primaryUserId, "PostgreSQL", { type: "note" }))[0]?.id, note.id);
    assert.equal((await search(primaryUserId, "\u7814\u7a76", { type: "source" }))[0]?.id, source.id);
    assert.equal((await search(primaryUserId, "\u8bc1\u636e", { type: "highlight" }))[0]?.id, highlight.id);
    assert.equal((await search(primaryUserId, "observation", { type: "highlight" }))[0]?.id, highlight.id);

    const allMatches = await search(primaryUserId, "\u6d88\u8d39", { limit: 1 });
    assert.equal(allMatches.length, 1);
    assert.ok(allMatches.every((item) => item.id !== archivedSource.id));
    assert.deepEqual(await search(primaryUserId, "", { type: "all" }), []);
  });
});

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { inArray } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { noteRelations, users } from "../db/schema";
import {
  getGlobalGraph,
  getLocalGraph,
  MAX_GRAPH_LIMIT,
} from "../lib/services/graph-service";
import { archiveNote, createNote } from "../lib/services/note-service";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000041";
const otherUserId = "00000000-0000-0000-0000-000000000042";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("graph services", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      { id: primaryUserId, email: "batch-e-primary@example.com" },
      { id: otherUserId, email: "batch-e-other@example.com" },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("builds depth-one and depth-two local graphs without duplicate nodes", databaseTestOptions, async () => {
    const leaf = await createNote(primaryUserId, { title: "Leaf" });
    const left = await createNote(primaryUserId, { title: "Left", contentMarkdown: "[[Leaf]]" });
    const right = await createNote(primaryUserId, { title: "Right", contentMarkdown: "[[Leaf]]" });
    const current = await createNote(primaryUserId, {
      title: "Current",
      contentMarkdown: "[[Left]]\n\n[[Right]]",
      tagNames: [" graph "],
    });

    const depthOne = await getLocalGraph(primaryUserId, current.id);
    assert.deepEqual(new Set(depthOne.nodes.map((node) => node.id)), new Set([current.id, left.id, right.id]));
    assert.equal(depthOne.edges.length, 2);
    assert.equal(depthOne.nodes.some((node) => node.id === leaf.id), false);
    assert.equal(depthOne.nodes.find((node) => node.id === current.id)?.tags[0], "graph");

    const depthTwo = await getLocalGraph(primaryUserId, current.id, { depth: 2 });
    assert.deepEqual(new Set(depthTwo.nodes.map((node) => node.id)), new Set([current.id, left.id, right.id, leaf.id]));
    assert.equal(depthTwo.edges.length, 4);
  });

  it("filters suggested and rejected relations and excludes archived notes", databaseTestOptions, async () => {
    const target = await createNote(primaryUserId, { title: "Suggested Target" });
    const current = await createNote(primaryUserId, { title: "Suggested Current" });
    const rejected = await createNote(primaryUserId, { title: "Rejected Target" });
    const archived = await createNote(primaryUserId, { title: "Archived Target" });
    await archiveNote(primaryUserId, archived.id);
    await getDb().insert(noteRelations).values([
      {
        userId: primaryUserId,
        sourceNoteId: current.id,
        targetNoteId: target.id,
        relationType: "ai_suggested",
        status: "suggested",
        originKey: "suggested",
      },
      {
        userId: primaryUserId,
        sourceNoteId: current.id,
        targetNoteId: rejected.id,
        relationType: "manual",
        status: "rejected",
        originKey: "rejected",
      },
      {
        userId: primaryUserId,
        sourceNoteId: current.id,
        targetNoteId: archived.id,
        relationType: "manual",
        status: "confirmed",
        originKey: "archived",
      },
    ]);

    const confirmedOnly = await getLocalGraph(primaryUserId, current.id);
    assert.equal(confirmedOnly.nodes.some((node) => node.id === target.id), false);
    assert.equal(confirmedOnly.nodes.some((node) => node.id === rejected.id), false);
    assert.equal(confirmedOnly.nodes.some((node) => node.id === archived.id), false);

    const withSuggested = await getLocalGraph(primaryUserId, current.id, { includeSuggested: true });
    assert.equal(withSuggested.nodes.some((node) => node.id === target.id), true);
    assert.equal(withSuggested.edges.some((edge) => edge.status === "suggested"), true);
    assert.equal(withSuggested.edges.some((edge) => edge.target === rejected.id), false);
  });

  it("builds a compact, filtered, user-scoped global graph", databaseTestOptions, async () => {
    const target = await createNote(primaryUserId, { title: "Global Target", tagNames: ["Topic"] });
    const source = await createNote(primaryUserId, { title: "Global Source", contentMarkdown: "[[Global Target]]" });
    const otherTarget = await createNote(otherUserId, { title: "Other Target" });

    const graph = await getGlobalGraph(primaryUserId, { tag: " topic " });
    assert.equal(graph.nodes.some((node) => node.id === target.id), true);
    assert.equal(graph.nodes.some((node) => node.id === source.id), false);
    assert.equal(graph.edges.length, 0);
    assert.equal(graph.nodes.every((node) => !Object.prototype.hasOwnProperty.call(node, "contentMarkdown")), true);

    const all = await getGlobalGraph(primaryUserId, { relationType: "wikilink", limit: 9999 });
    assert.equal(all.edges.every((edge) => edge.relationType === "wikilink"), true);
    assert.equal(all.nodes.length <= MAX_GRAPH_LIMIT, true);
    assert.equal(all.nodes.some((node) => node.id === otherTarget.id), false);

    const isolated = await createNote(primaryUserId, { title: "Isolated" });
    const isolatedGraph = await getLocalGraph(primaryUserId, isolated.id);
    assert.deepEqual(isolatedGraph.nodes.map((node) => node.id), [isolated.id]);
    assert.deepEqual(isolatedGraph.edges, []);
  });
});

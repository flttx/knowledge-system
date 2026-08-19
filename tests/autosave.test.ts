import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createAutosaveQueue } from "../lib/notes/autosave";

describe("autosave queue", () => {
  it("serializes writes so the latest queued content finishes last", async () => {
    const queue = createAutosaveQueue();
    const events: string[] = [];
    let releaseFirst: (() => void) | undefined;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = queue.enqueue(async () => {
      events.push("start-a");
      await firstGate;
      events.push("end-a");
      return "A";
    });
    const second = queue.enqueue(async () => {
      events.push("start-b");
      events.push("end-b");
      return "B";
    });

    await Promise.resolve();
    assert.deepEqual(events, ["start-a"]);
    releaseFirst?.();

    assert.equal(await first, "A");
    assert.equal(await second, "B");
    assert.deepEqual(events, ["start-a", "end-a", "start-b", "end-b"]);
  });
});

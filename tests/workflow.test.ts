import assert from "node:assert/strict";
import test from "node:test";

import {
  inboxItemHref,
  safeReturnTo,
  validCaptureImage,
  withReturnTo,
} from "../lib/workflow";
import {
  compareInbox,
  decodeInboxCursor,
  encodeInboxCursor,
} from "../lib/services/inbox-pagination";

test("workflow links keep only safe internal return paths", () => {
  assert.equal(safeReturnTo("/search?q=reading"), "/search?q=reading");
  assert.equal(safeReturnTo("https://evil.example/phish"), "/notes");
  assert.equal(withReturnTo("/notes/note-id", "/search?q=reading"), "/notes/note-id?returnTo=%2Fsearch%3Fq%3Dreading");
  assert.equal(inboxItemHref("highlight", "item-id"), "/inbox?itemType=highlight&itemId=item-id");
});

test("capture image validation accepts the supported formats and size limit", () => {
  assert.equal(validCaptureImage({ type: "image/png", size: 1 }), true);
  assert.equal(validCaptureImage({ type: "image/svg+xml", size: 1 }), false);
  assert.equal(validCaptureImage({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 }), false);
});

test("inbox cursors round trip and preserve stable ordering", () => {
  const newest = { createdAt: new Date("2026-01-02T00:00:00.000Z"), type: "highlight" as const, id: "11111111-1111-1111-1111-111111111111" };
  const older = { createdAt: new Date("2026-01-01T00:00:00.000Z"), type: "quick_note" as const, id: "22222222-2222-2222-2222-222222222222" };
  assert.deepEqual(decodeInboxCursor(encodeInboxCursor(newest)), newest);
  assert.equal(compareInbox(newest, older) < 0, true);
  assert.throws(() => decodeInboxCursor("invalid"));
});

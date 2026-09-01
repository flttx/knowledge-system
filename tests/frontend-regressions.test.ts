import assert from "node:assert/strict";
import test from "node:test";

import { requestJson } from "@/lib/api/client";
import { createSourceSchema, updateSourceSchema } from "@/lib/services/validation";
import { isSafeHttpUrl } from "@/lib/urls/safe-http-url";

test("source URLs only allow explicit HTTP and HTTPS schemes", () => {
  assert.equal(isSafeHttpUrl("https://example.com/read"), true);
  assert.equal(isSafeHttpUrl("http://localhost:3000/source"), true);

  for (const value of [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "file:///etc/passwd",
    "mailto:reader@example.com",
    "/relative/source",
    "not a URL",
  ]) {
    assert.equal(isSafeHttpUrl(value), false, value);
    assert.equal(
      createSourceSchema.safeParse({ title: "Source", sourceType: "article", url: value }).success,
      false,
      value,
    );
    assert.equal(updateSourceSchema.safeParse({ url: value }).success, false, value);
  }
});

test("requestJson rejects unsuccessful HTTP responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    JSON.stringify({ error: { message: "服务暂时不可用" } }),
    { status: 503, headers: { "content-type": "application/json" } },
  );

  try {
    await assert.rejects(
      () => requestJson("/api/frontend-regression"),
      (error: unknown) => error instanceof Error && error.message === "服务暂时不可用",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("requestJson parses successful JSON responses", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({ ok: true }), { status: 200 });

  try {
    assert.deepEqual(await requestJson<{ ok: boolean }>("/api/frontend-regression"), { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

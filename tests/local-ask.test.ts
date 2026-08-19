import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { localAskRequestSchema, writeAskRequest } from "../lib/local-agent/ask";

describe("local Ask Knowledge workflow", () => {
  it("requires a pulled Notes workspace", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "knowledge-ask-"));
    await assert.rejects(
      () => writeAskRequest(workspace, "问题"),
      /knowledge pull --notes/,
    );
    await rm(workspace, { recursive: true, force: true });
  });

  it("writes a validated UTF-8 request without credentials or changing Notes", async () => {
    const workspace = await mkdtemp(path.join(os.tmpdir(), "knowledge-ask-"));
    await mkdir(path.join(workspace, "notes"), { recursive: true });
    const markdown = "# 保持原文\n\n[[目标 Note]]";
    await writeFile(path.join(workspace, "notes", "note-1.md"), markdown, "utf8");
    await writeFile(
      path.join(workspace, "notes", "index.json"),
      JSON.stringify([{ id: "note-1", title: "本地 Note" }]),
      "utf8",
    );
    await writeFile(path.join(workspace, "ask", "response.md"), "previous", "utf8").catch(() => undefined);

    const result = await writeAskRequest(workspace, "我关于年轻人消费形成了哪些观点？");
    const request = localAskRequestSchema.parse(
      JSON.parse(await readFile(result.requestPath, "utf8")) as unknown,
    );
    assert.equal(request.question, "我关于年轻人消费形成了哪些观点？");
    assert.equal(request.responsePath, "ask/response.md");
    assert.equal(request.inputPaths.includes("notes/"), true);
    assert.equal(JSON.stringify(request).includes("DATABASE_URL"), false);
    assert.equal(JSON.stringify(request).includes("TOKEN"), false);
    assert.equal(await readFile(path.join(workspace, "notes", "note-1.md"), "utf8"), markdown);

    await mkdir(path.join(workspace, "ask"), { recursive: true });
    await writeFile(path.join(workspace, "ask", "response.md"), "previous", "utf8");
    await writeAskRequest(workspace, "第二个问题");
    assert.equal(await readFile(path.join(workspace, "ask", "response.md"), "utf8"), "previous");
    assert.equal(JSON.parse(await readFile(result.requestPath, "utf8")).question, "第二个问题");
    await rm(workspace, { recursive: true, force: true });
  });
});

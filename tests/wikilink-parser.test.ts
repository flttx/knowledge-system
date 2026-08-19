import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseWikilinks } from "../lib/wikilinks/parser";

describe("wikilink parser", () => {
  it("parses links, aliases, Chinese titles, duplicates, and positions", () => {
    const markdown = "前 [[目标笔记]] 中 [[目标笔记|显示名称]] 后 [[第二篇]]。";
    const links = parseWikilinks(markdown);

    assert.deepEqual(links, [
      { targetTitle: "目标笔记", start: 2, end: 10 },
      { targetTitle: "目标笔记", alias: "显示名称", start: 13, end: 26 },
      { targetTitle: "第二篇", start: 29, end: 36 },
    ]);
  });

  it("trims target whitespace while preserving alias text", () => {
    const markdown = "[[ 目标 | 显示 名称 ]]";
    assert.deepEqual(parseWikilinks(markdown), [
      { targetTitle: "目标", alias: " 显示 名称 ", start: 0, end: markdown.length },
    ]);
  });

  it("ignores malformed and incomplete links without mutating Markdown", () => {
    const markdown = "[[缺少结尾  [[|别名]] [[有效]] [[空别名| ]]";
    assert.deepEqual(parseWikilinks(markdown), [
      { targetTitle: "有效", start: 16, end: 22 },
    ]);
    assert.equal(markdown, "[[缺少结尾  [[|别名]] [[有效]] [[空别名| ]] ".trimEnd());
  });
});

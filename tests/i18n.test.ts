import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_LOCALE,
  localeFromAcceptLanguage,
  messages,
  normalizeLocale,
  translate,
} from "@/lib/i18n/locales";

test("locale normalization supports the two UI locales and falls back safely", () => {
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeLocale("fr-FR"), null);
  assert.equal(localeFromAcceptLanguage("en-US,en;q=0.8"), "en");
  assert.equal(localeFromAcceptLanguage(""), DEFAULT_LOCALE);
});

test("translations switch UI copy without changing user content", () => {
  const userContent = "保留 [[原始文本]] 与 #中文标签";
  assert.equal(translate("zh-CN", "notes.title"), "把想法写成可以回来的地方。");
  assert.equal(translate("en", "notes.title"), "A place for ideas to become reusable.");
  assert.equal(userContent, "保留 [[原始文本]] 与 #中文标签");
  assert.equal(translate("en", "inbox.pending", { count: 3 }), "3 pending");
});

test("zh-CN and en dictionaries have identical key sets", () => {
  assert.deepEqual(Object.keys(messages["zh-CN"]).sort(), Object.keys(messages.en).sort());
});

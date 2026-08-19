import { createHash } from "node:crypto";

import type { LocalSuggestion } from "./suggestions";

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function hashLocalSuggestion(suggestion: LocalSuggestion): string {
  return createHash("sha256")
    .update(stableJson(suggestion), "utf8")
    .digest("hex");
}

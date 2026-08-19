import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import {
  parseLocalSuggestion,
  type LocalSuggestion,
} from "../../lib/local-agent/suggestions";
import { relationPairKey } from "../../lib/local-agent/relation";

export interface LocalSuggestionFile {
  fileName: string;
  suggestion: LocalSuggestion;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readIds(filePath: string): Promise<Set<string>> {
  const content = await readFile(filePath, "utf8").catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "[]";
    throw error;
  });
  const value = JSON.parse(content) as unknown;
  if (!Array.isArray(value)) {
    throw new Error(`Workspace input is not an array: ${filePath}`);
  }
  const ids = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string") {
      throw new Error(`Workspace input contains an invalid item: ${filePath}`);
    }
    ids.add(item.id);
  }
  return ids;
}

async function readRelationMemory(filePath: string): Promise<Set<string>> {
  const content = await readFile(filePath, "utf8").catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return "[]";
    throw error;
  });
  const value = JSON.parse(content) as unknown;
  if (!Array.isArray(value)) {
    throw new Error(`Workspace input is not an array: ${filePath}`);
  }
  const keys = new Set<string>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.sourceNoteId !== "string" || typeof item.targetNoteId !== "string") {
      continue;
    }
    if (item.relationType === "semantic" || item.relationType === "ai_suggested") {
      keys.add(relationPairKey(item.relationType, item.sourceNoteId, item.targetNoteId));
    } else if (item.relationType === "wikilink" || item.relationType === "manual") {
      keys.add(relationPairKey("semantic", item.sourceNoteId, item.targetNoteId));
    }
  }
  return keys;
}

export async function readSuggestionFiles(
  workspaceDirectory: string,
): Promise<LocalSuggestionFile[]> {
  const suggestionsDirectory = path.join(workspaceDirectory, "suggestions");
  const entries = await readdir(suggestionsDirectory, { withFileTypes: true }).catch(
    (error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    },
  );
  const jsonFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .sort((left, right) => left.name.localeCompare(right.name));
  const highlightIds = await readIds(
    path.join(workspaceDirectory, "inbox", "highlights.json"),
  );
  const quickNoteIds = await readIds(
    path.join(workspaceDirectory, "inbox", "quick-notes.json"),
  );
  const noteIds = await readIds(
    path.join(workspaceDirectory, "notes", "index.json"),
  );
  const relationMemory = await readRelationMemory(
    path.join(workspaceDirectory, "relations.json"),
  );

  const files: LocalSuggestionFile[] = [];
  for (const entry of jsonFiles) {
    const fileName = entry.name;
    let value: unknown;
    try {
      value = JSON.parse(
        await readFile(path.join(suggestionsDirectory, fileName), "utf8"),
      ) as unknown;
    } catch {
      throw new Error(`Invalid JSON suggestion file: ${fileName}`);
    }
    let suggestion: LocalSuggestion;
    try {
      suggestion = parseLocalSuggestion(value);
    } catch {
      throw new Error(`Suggestion schema validation failed: ${fileName}`);
    }
    if (suggestion.type === "relation") {
      if (!noteIds.has(suggestion.sourceNoteId) || !noteIds.has(suggestion.targetNoteId)) {
        throw new Error(`Relation ${fileName} references a Note absent from the pulled workspace.`);
      }
      if (relationMemory.has(relationPairKey(
        suggestion.relationType,
        suggestion.sourceNoteId,
        suggestion.targetNoteId,
      ))) {
        throw new Error(`Relation ${fileName} is already confirmed or rejected in the workspace.`);
      }
    } else {
      for (const reference of suggestion.sourceReferences) {
        const ids = reference.type === "highlight" ? highlightIds : quickNoteIds;
        if (!ids.has(reference.id)) {
          throw new Error(
            `Suggestion ${fileName} references an ID absent from the pulled workspace.`,
          );
        }
      }
    }
    files.push({ fileName, suggestion });
  }
  return files;
}

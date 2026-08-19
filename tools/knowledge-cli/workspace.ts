import { mkdir, readdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  LocalAgentNote,
  LocalAgentPullResponse,
} from "../../lib/local-agent/types";

export interface WorkspaceSummary {
  exists: boolean;
  lastPullAt: string | null;
  scope: string | null;
  counts: {
    highlights: number;
    quickNotes: number;
    sources: number;
    notes: number;
    relations: number;
  };
}

interface WorkspaceContext {
  version: 1;
  generatedAt: string;
  baseUrl: string;
  pullScope: string;
  counts: WorkspaceSummary["counts"];
}

function jsonText(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function writeAtomic(filePath: string, content: string): Promise<void> {
  const temporaryPath = `${filePath}.${process.pid}.tmp`;
  try {
    await writeFile(temporaryPath, content, "utf8");
    await rename(temporaryPath, filePath);
  } catch (error: unknown) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

async function writeJsonAtomic(filePath: string, value: unknown): Promise<void> {
  await writeAtomic(filePath, jsonText(value));
}

function noteIndex(response: LocalAgentPullResponse) {
  return response.notes.map((note) => ({
    id: note.id,
    title: note.title,
    slug: note.slug,
    file: `${note.id}.md`,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  }));
}

async function removeStaleNoteFiles(
  notesDirectory: string,
  currentNoteIds: Set<string>,
): Promise<void> {
  const entries = await readdir(notesDirectory, { withFileTypes: true });
  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(".md") &&
          !currentNoteIds.has(entry.name.slice(0, -3)),
      )
      .map((entry) => unlink(path.join(notesDirectory, entry.name))),
  );
}

async function writeNotes(
  workspaceDirectory: string,
  response: LocalAgentPullResponse,
): Promise<void> {
  const notesDirectory = path.join(workspaceDirectory, "notes");
  await mkdir(notesDirectory, { recursive: true });
  await removeStaleNoteFiles(
    notesDirectory,
    new Set(response.notes.map((note) => note.id)),
  );

  await Promise.all(
    response.notes.map((note: LocalAgentNote) =>
      writeAtomic(path.join(notesDirectory, `${note.id}.md`), note.contentMarkdown),
    ),
  );
  await writeJsonAtomic(path.join(notesDirectory, "index.json"), noteIndex(response));
  await writeJsonAtomic(path.join(workspaceDirectory, "relations.json"), response.relations);
}

export async function writeWorkspace(
  workspaceDirectory: string,
  baseUrl: string,
  response: LocalAgentPullResponse,
): Promise<void> {
  const inboxDirectory = path.join(workspaceDirectory, "inbox");
  const suggestionsDirectory = path.join(workspaceDirectory, "suggestions");
  await mkdir(inboxDirectory, { recursive: true });
  await mkdir(suggestionsDirectory, { recursive: true });
  const instructions = await readFile(
    path.resolve(process.cwd(), "docs", "CODEX_INBOX_INSTRUCTIONS.md"),
    "utf8",
  );
  await writeAtomic(
    path.join(workspaceDirectory, "CODEX_INSTRUCTIONS.md"),
    instructions,
  );

  if (response.scope === "inbox" || response.scope === "all") {
    await writeJsonAtomic(
      path.join(inboxDirectory, "highlights.json"),
      response.inbox.highlights,
    );
    await writeJsonAtomic(
      path.join(inboxDirectory, "quick-notes.json"),
      response.inbox.quickNotes,
    );
    await writeJsonAtomic(path.join(inboxDirectory, "sources.json"), response.sources);
  }

  if (response.scope === "notes" || response.scope === "all") {
    await writeNotes(workspaceDirectory, response);
  }

  const context: WorkspaceContext = {
    version: 1,
    generatedAt: response.generatedAt,
    baseUrl,
    pullScope: response.scope,
    counts: response.counts,
  };
  await writeJsonAtomic(path.join(workspaceDirectory, "context.json"), context);
}

function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

export async function readWorkspaceSummary(
  workspaceDirectory: string,
): Promise<WorkspaceSummary> {
  let context: Partial<WorkspaceContext> | null = null;
  try {
    const content = await readFile(path.join(workspaceDirectory, "context.json"), "utf8");
    context = JSON.parse(content) as Partial<WorkspaceContext>;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  const inboxHighlights = await readArray(path.join(workspaceDirectory, "inbox", "highlights.json"));
  const inboxQuickNotes = await readArray(path.join(workspaceDirectory, "inbox", "quick-notes.json"));
  const sources = await readArray(path.join(workspaceDirectory, "inbox", "sources.json"));
  const notes = await readArray(path.join(workspaceDirectory, "notes", "index.json"));
  const relations = await readArray(path.join(workspaceDirectory, "relations.json"));
  const exists = context !== null || inboxHighlights > 0 || inboxQuickNotes > 0 || sources > 0 || notes > 0 || relations > 0;
  return {
    exists,
    lastPullAt: typeof context?.generatedAt === "string" ? context.generatedAt : null,
    scope: typeof context?.pullScope === "string" ? context.pullScope : null,
    counts: {
      highlights: inboxHighlights,
      quickNotes: inboxQuickNotes,
      sources,
      notes,
      relations,
    },
  };
}

async function readArray(filePath: string): Promise<number> {
  try {
    return countItems(JSON.parse(await readFile(filePath, "utf8")) as unknown);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }
}

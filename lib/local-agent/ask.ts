import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

const askInputPaths = [
  "context.json",
  "notes/index.json",
  "notes/",
  "relations.json",
] as const;

export const localAskRequestSchema = z.object({
  version: z.literal(1),
  question: z.string().min(1).max(5000).refine((value) => value.trim().length > 0),
  createdAt: z.string().datetime({ offset: true }),
  responsePath: z.literal("ask/response.md"),
  instructionFile: z.literal("CODEX_INSTRUCTIONS.md"),
  inputPaths: z.array(z.enum(askInputPaths)).min(1),
});

export type LocalAskRequest = z.infer<typeof localAskRequestSchema>;

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

export async function writeAskRequest(
  workspaceDirectory: string,
  question: string,
  now = new Date(),
): Promise<{ requestPath: string; responsePath: string; request: LocalAskRequest }> {
  const notesIndexPath = path.join(workspaceDirectory, "notes", "index.json");
  let notesValue: unknown;
  try {
    notesValue = JSON.parse(await readFile(notesIndexPath, "utf8")) as unknown;
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("A Notes workspace is required. Run knowledge pull --notes first.");
    }
    throw new Error("The local Notes workspace is invalid.");
  }
  if (!Array.isArray(notesValue)) {
    throw new Error("The local Notes workspace is invalid.");
  }

  const request = localAskRequestSchema.parse({
    version: 1,
    question,
    createdAt: now.toISOString(),
    responsePath: "ask/response.md",
    instructionFile: "CODEX_INSTRUCTIONS.md",
    inputPaths: [...askInputPaths],
  });
  const askDirectory = path.join(workspaceDirectory, "ask");
  await mkdir(askDirectory, { recursive: true });
  const requestPath = path.join(askDirectory, "request.json");
  await writeAtomic(requestPath, `${JSON.stringify(request, null, 2)}\n`);
  return {
    requestPath,
    responsePath: path.join(askDirectory, "response.md"),
    request,
  };
}

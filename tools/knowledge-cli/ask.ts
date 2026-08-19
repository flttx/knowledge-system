import { writeAskRequest } from "../../lib/local-agent/ask";

export async function ask(
  workspaceDirectory: string,
  question: string,
): Promise<void> {
  if (question.trim().length === 0) {
    throw new Error("A question is required. Use: knowledge ask \"your question\".");
  }
  const result = await writeAskRequest(workspaceDirectory, question);
  console.log(
    `Ask Knowledge\n\nQuestion saved: ${result.requestPath}\nResponse path: ${result.responsePath}\n\nRun Codex manually in this workspace. It must read the request and local Notes, then write the documented response Markdown.`,
  );
}

#!/usr/bin/env node

import { readWorkspaceSummary, writeWorkspace } from "./workspace";
import { readSuggestionFiles } from "./suggestions";
import { ask } from "./ask";
import {
  parseLocalAgentPullResponse,
  type LocalAgentScope,
  type LocalAgentStatusResponse,
} from "../../lib/local-agent/types";

const workspaceDirectory = process.env.KNOWLEDGE_WORKSPACE?.trim() || ".local-knowledge";

class CliError extends Error {}

interface CliConfig {
  baseUrl: string;
  token: string;
}

function config(): CliConfig {
  const baseUrl = process.env.KNOWLEDGE_BASE_URL?.trim().replace(/\/+$/, "");
  const token = process.env.KNOWLEDGE_TOKEN?.trim();
  if (!baseUrl || !token) {
    throw new CliError(
      "KNOWLEDGE_BASE_URL and KNOWLEDGE_TOKEN must be configured; the token is never read from the workspace.",
    );
  }
  return { baseUrl, token };
}

async function requestJson(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...init?.headers,
      },
    });
  } catch {
    throw new CliError(`Unable to reach ${url}. Check the server URL and network.`);
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? (body.error as { message?: unknown }).message
        : null;
    throw new CliError(
      typeof message === "string"
        ? message
        : `Server request failed with HTTP ${response.status}.`,
    );
  }
  return body;
}

function printWorkspace(summary: Awaited<ReturnType<typeof readWorkspaceSummary>>): void {
  console.log(`workspace: ${summary.exists ? workspaceDirectory : "not initialized"}`);
  console.log(`last pull: ${summary.lastPullAt ?? "never"}`);
  console.log(`scope: ${summary.scope ?? "none"}`);
  console.log(
    `counts: highlights=${summary.counts.highlights} quickNotes=${summary.counts.quickNotes} sources=${summary.counts.sources} notes=${summary.counts.notes} relations=${summary.counts.relations}`,
  );
}

async function status(): Promise<void> {
  const summary = await readWorkspaceSummary(workspaceDirectory);
  printWorkspace(summary);
  let cliConfig: CliConfig;
  try {
    cliConfig = config();
  } catch (error: unknown) {
    console.log("server reachable: no");
    console.log("authenticated: no");
    throw error;
  }

  console.log("auth configured: yes");
  const value = (await requestJson(
    `${cliConfig.baseUrl}/api/local-agent/status`,
    cliConfig.token,
  )) as LocalAgentStatusResponse;
  console.log("server reachable: yes");
  console.log(`authenticated: ${value.authenticated ? "yes" : "no"}`);
  console.log(`scopes: ${value.scopes.join(", ")}`);
}

function pullScope(args: string[]): LocalAgentScope {
  const selected = args.filter((arg) => arg.startsWith("--"));
  if (selected.length > 1 || (selected[0] && !["--inbox", "--notes", "--all"].includes(selected[0]))) {
    throw new CliError("Use at most one of --inbox, --notes, or --all.");
  }
  if (selected[0] === "--inbox") return "inbox";
  if (selected[0] === "--notes") return "notes";
  return "all";
}

async function pull(args: string[]): Promise<void> {
  const cliConfig = config();
  const scope = pullScope(args);
  const body = await requestJson(
    `${cliConfig.baseUrl}/api/local-agent/pull`,
    cliConfig.token,
    { method: "POST", body: JSON.stringify({ scope }) },
  );
  const response = parseLocalAgentPullResponse(body);
  await writeWorkspace(workspaceDirectory, cliConfig.baseUrl, response);
  console.log(
    `pulled ${response.scope}: highlights=${response.counts.highlights} quickNotes=${response.counts.quickNotes} sources=${response.counts.sources} notes=${response.counts.notes} relations=${response.counts.relations}`,
  );
}

async function push(): Promise<void> {
  const files = await readSuggestionFiles(workspaceDirectory);
  if (files.length === 0) {
    console.log("Knowledge Push\n\nValidated: 0\nImported: 0\nAlready present: 0\nRejected: 0");
    return;
  }
  const cliConfig = config();
  const value = await requestJson(
    `${cliConfig.baseUrl}/api/local-agent/suggestions/import`,
    cliConfig.token,
    {
      method: "POST",
      body: JSON.stringify({ suggestions: files.map((file) => file.suggestion) }),
    },
  );
  if (
    typeof value !== "object" ||
    value === null ||
    !("counts" in value) ||
    typeof value.counts !== "object" ||
    value.counts === null
  ) {
    throw new CliError("Server returned an invalid suggestion import response.");
  }
  const counts = value.counts as {
    validated?: unknown;
    imported?: unknown;
    alreadyPresent?: unknown;
  };
  if (
    typeof counts.validated !== "number" ||
    typeof counts.imported !== "number" ||
    typeof counts.alreadyPresent !== "number"
  ) {
    throw new CliError("Server returned an invalid suggestion import response.");
  }
  console.log(
    `Knowledge Push\n\nValidated: ${counts.validated}\nImported: ${counts.imported}\nAlready present: ${counts.alreadyPresent}\nRejected: 0`,
  );
}

function usage(): void {
  console.log("Usage: npm run knowledge -- <status|pull [--inbox|--notes|--all]|push|ask \"question\">");
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "status") {
    await status();
    return;
  }
  if (command === "pull") {
    await pull(args);
    return;
  }
  if (command === "push" && args.length === 0) {
    await push();
    return;
  }
  if (command === "ask") {
    await ask(workspaceDirectory, args.join(" "));
    return;
  }
  usage();
  throw new CliError("A supported command is required.");
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Knowledge CLI failed.");
  process.exitCode = 1;
});

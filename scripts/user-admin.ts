import { loadEnvConfig } from "@next/env";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { and, eq, ne } from "drizzle-orm";

import { getDb, closeDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { isValidUsername, normalizeUsername } from "@/lib/auth/config";

loadEnvConfig(process.cwd());

interface Arguments {
  command: "create" | "set-password";
  username: string;
  userId?: string;
  email?: string;
  displayName?: string;
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  if (index >= 0) return args[index + 1];
  const inline = args.find((argument) => argument.startsWith(`${flag}=`));
  return inline?.slice(flag.length + 1);
}

function parseArguments(argv: string[]): Arguments {
  const command = argv[0];
  if (command !== "create" && command !== "set-password") {
    throw new Error("Use user:create or user:set-password.");
  }
  const username = valueAfter(argv, "--username");
  if (!username || !isValidUsername(username)) {
    throw new Error("--username must be 3 to 80 characters.");
  }
  return {
    command,
    username: normalizeUsername(username),
    userId: valueAfter(argv, "--user-id"),
    email: valueAfter(argv, "--email")?.trim().toLowerCase(),
    displayName: valueAfter(argv, "--display-name")?.trim(),
  };
}

async function readSecret(prompt: string): Promise<string> {
  if (!stdin.isTTY || !stdin.setRawMode) {
    const reader = createInterface({ input: stdin, output: stdout });
    try {
      return await reader.question(`${prompt}: `);
    } finally {
      reader.close();
      stdin.pause();
    }
  }

  return new Promise((resolve, reject) => {
    let value = "";
    const onData = (chunk: Buffer): void => {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          stdout.write("\n");
          resolve(value);
          return;
        }
        if (character === "\u007f") {
          value = value.slice(0, -1);
        } else {
          value += character;
        }
      }
    };
    const cleanup = (): void => {
      stdin.setRawMode?.(false);
      stdin.off("data", onData);
      stdin.pause();
    };
    stdout.write(`${prompt}: `);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.on("data", onData);
  });
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const password = await readSecret("Password");
  if (!password) throw new Error("Password cannot be empty.");
  const passwordHash = await hashPassword(password);
  const db = getDb();

  if (options.command === "create") {
    await db.insert(users).values({
      username: options.username,
      passwordHash,
      email: options.email ?? null,
      displayName: options.displayName ?? null,
      status: "active",
    });
    process.stdout.write(`Created user ${options.username}.\n`);
    return;
  }

  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(options.userId ? eq(users.id, options.userId) : eq(users.username, options.username))
    .limit(1);
  if (!user) throw new Error("Target user was not found.");

  const [conflict] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, options.username), ne(users.id, user.id)))
    .limit(1);
  if (conflict) throw new Error("Username is already in use.");

  await db
    .update(users)
    .set({
      username: options.username,
      passwordHash,
      status: "active",
      ...(options.email !== undefined ? { email: options.email } : {}),
      ...(options.displayName !== undefined ? { displayName: options.displayName } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));
  process.stdout.write(`Updated credentials for ${options.username}.\n`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "User command failed.");
    process.exitCode = 1;
  })
  .finally(() => closeDb());

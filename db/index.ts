import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";

type SqlClient = ReturnType<typeof postgres>;

let sqlClient: SqlClient | undefined;

function resolveDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    // Next.js loads these automatically, but CLI/test entry points do not.
    // Keep the same precedence as Next.js for development environments.
    for (const filename of [".env.local", ".env.development", ".env"]) {
      const envPath = path.resolve(process.cwd(), filename);
      if (!fs.existsSync(envPath)) continue;

      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          const val = trimmed.slice("DATABASE_URL=".length).trim();
          process.env.DATABASE_URL = val;
          return val;
        }
      }
    }
  } catch {}
  return "";
}

export function getDb() {
  const databaseUrl = resolveDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  sqlClient ??= postgres(databaseUrl, { prepare: false });
  return drizzle(sqlClient, { schema });
}

export async function closeDb(): Promise<void> {
  if (sqlClient) {
    await sqlClient.end();
    sqlClient = undefined;
  }
}

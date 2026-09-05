import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  try {
    // Match Next.js development env precedence for commands run outside Next.
    for (const filename of [".env.local", ".env.development", ".env"]) {
      const envPath = path.resolve(process.cwd(), filename);
      if (!fs.existsSync(envPath)) continue;

      const content = fs.readFileSync(envPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (trimmed.startsWith("DATABASE_URL=")) {
          return trimmed.slice("DATABASE_URL=".length).trim();
        }
      }
    }
  } catch {}
  return "postgresql://postgres:postgres@127.0.0.1:55432/knowledge_system";
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  strict: true,
  verbose: true,
});

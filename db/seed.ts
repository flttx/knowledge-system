import { loadEnvConfig } from "@next/env";
import postgres from "postgres";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run the database seed check.");
  }

  const sql = postgres(databaseUrl, { prepare: false });
  try {
    const result = await sql<{ count: string }[]>`
      select count(*)::text as count from users where status = 'active'
    `;
    process.stdout.write(
      `Database seed check complete. Active users: ${result[0]?.count ?? "0"}. Use user:create to provision credentials.\n`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Seed failed.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});

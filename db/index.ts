import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

import * as schema from "@/db/schema";

type SqlClient = ReturnType<typeof postgres>;

let sqlClient: SqlClient | undefined;

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;

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

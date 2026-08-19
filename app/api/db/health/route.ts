import { sql } from "drizzle-orm";

import { getCurrentUser } from "@/lib/auth/server";
import { getDb } from "@/db";

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 },
    );
  }

  try {
    await getDb().execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: { code: "DATABASE_UNAVAILABLE", message: "Database unavailable." } },
      { status: 503 },
    );
  }
}

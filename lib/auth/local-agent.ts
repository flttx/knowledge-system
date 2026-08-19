import { createHash } from "node:crypto";

import { and, eq, gt, isNull, or } from "drizzle-orm";

import { getDb } from "@/db";
import { localAgentTokens, users } from "@/db/schema";

export interface LocalAgentUser {
  id: string;
}

function tokenDigest(token: string): Buffer {
  return createHash("sha256").update(token, "utf8").digest();
}

function bearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization) return null;

  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization.trim());
  return match?.[1] ?? null;
}

export async function getLocalAgentUser(
  request: Request,
): Promise<LocalAgentUser | null> {
  const token = bearerToken(request);
  if (!token) {
    return null;
  }

  const tokenHash = tokenDigest(token).toString("hex");
  const now = new Date();
  const db = getDb();
  const [row] = await db
    .select({ id: users.id, tokenId: localAgentTokens.id })
    .from(localAgentTokens)
    .innerJoin(users, eq(localAgentTokens.userId, users.id))
    .where(
      and(
        eq(localAgentTokens.tokenHash, tokenHash),
        isNull(localAgentTokens.revokedAt),
        eq(users.status, "active"),
        or(
          isNull(localAgentTokens.expiresAt),
          gt(localAgentTokens.expiresAt, now),
        ),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  await db
    .update(localAgentTokens)
    .set({ lastUsedAt: now })
    .where(eq(localAgentTokens.id, row.tokenId));
  return { id: row.id };
}

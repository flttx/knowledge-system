import { createHash, randomBytes } from "node:crypto";

import { and, asc, eq, isNull } from "drizzle-orm";

import { getDb } from "@/db";
import { localAgentTokens } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/lib/services/errors";

export interface LocalAgentTokenSummary {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
}

export interface CreatedLocalAgentToken extends LocalAgentTokenSummary {
  token: string;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function normalizeName(value: string): string {
  return value.trim().slice(0, 120);
}

export async function listLocalAgentTokens(
  userId: string,
): Promise<LocalAgentTokenSummary[]> {
  return getDb()
    .select({
      id: localAgentTokens.id,
      name: localAgentTokens.name,
      createdAt: localAgentTokens.createdAt,
      lastUsedAt: localAgentTokens.lastUsedAt,
      expiresAt: localAgentTokens.expiresAt,
      revokedAt: localAgentTokens.revokedAt,
    })
    .from(localAgentTokens)
    .where(eq(localAgentTokens.userId, userId))
    .orderBy(asc(localAgentTokens.createdAt));
}

export async function createLocalAgentToken(
  userId: string,
  nameValue: string,
): Promise<CreatedLocalAgentToken> {
  const name = normalizeName(nameValue);
  if (!name) {
    throw new ValidationError({ name: ["Token name is required."] });
  }

  const token = `knw_${randomBytes(32).toString("base64url")}`;
  const [created] = await getDb()
    .insert(localAgentTokens)
    .values({ userId, name, tokenHash: hashToken(token) })
    .returning();
  if (!created) {
    throw new Error("Local Agent token creation failed.");
  }

  return { ...created, token };
}

export async function revokeLocalAgentToken(
  userId: string,
  tokenId: string,
): Promise<void> {
  const result = await getDb()
    .update(localAgentTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(localAgentTokens.id, tokenId),
        eq(localAgentTokens.userId, userId),
        isNull(localAgentTokens.revokedAt),
      ),
    )
    .returning({ id: localAgentTokens.id });
  if (result.length === 0) {
    throw new NotFoundError("Local Agent token not found.");
  }
}

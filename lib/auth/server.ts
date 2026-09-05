import "server-only";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "@/lib/auth/session";
import type { AuthUser } from "@/lib/auth/types";

const SESSION_ACTIVITY_UPDATE_INTERVAL_MS = 60_000;

export async function getUserForSessionToken(
  token: string | undefined,
): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  const db = getDb();
  const now = new Date();
  const tokenHash = hashSessionToken(token);
  const [row] = await db
    .select({
      sessionId: sessions.id,
      lastSeenAt: sessions.lastSeenAt,
      id: users.id,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, tokenHash),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, now),
        eq(users.status, "active"),
      ),
    )
    .limit(1);

  if (!row || !row.username) {
    return null;
  }

  // Activity is informational; do not add a remote write to every API request.
  // Keep it fresh enough for session diagnostics while avoiding an extra round trip.
  if (
    !row.lastSeenAt ||
    now.getTime() - row.lastSeenAt.getTime() >= SESSION_ACTIVITY_UPDATE_INTERVAL_MS
  ) {
    await db
      .update(sessions)
      .set({ lastSeenAt: now })
      .where(eq(sessions.id, row.sessionId));
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    displayName: row.displayName,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  try {
    return await getUserForSessionToken(
      cookieStore.get(SESSION_COOKIE_NAME)?.value,
    );
  } catch (error: unknown) {
    console.error("[auth] session lookup failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return null;
  }
}

export async function requireUser(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function setSession(userId: string): Promise<void> {
  const token = createSessionToken();
  const now = new Date();
  const cookieStore = await cookies();
  await getDb().insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
    lastSeenAt: now,
  });
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  try {
    if (token) {
      await getDb()
        .update(sessions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(sessions.tokenHash, hashSessionToken(token)),
            isNull(sessions.revokedAt),
          ),
        );
    }
  } catch (error: unknown) {
    console.error("[auth] session revocation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
  } finally {
    cookieStore.delete(SESSION_COOKIE_NAME);
  }
}

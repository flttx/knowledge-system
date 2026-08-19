import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import { and, eq, gt, inArray, isNull } from "drizzle-orm";

import { closeDb, getDb } from "../db";
import { sessions, users } from "../db/schema";
import { normalizeUsername, isValidUsername } from "../lib/auth/config";
import { hashPassword, verifyPassword } from "../lib/auth/password";
import {
  createSessionToken,
  hashSessionToken,
  SESSION_TTL_SECONDS,
} from "../lib/auth/session";

const databaseUrl = process.env.DATABASE_URL;
const primaryUserId = "00000000-0000-0000-0000-000000000181";
const otherUserId = "00000000-0000-0000-0000-000000000182";
const databaseTestOptions = { skip: !databaseUrl };

async function cleanDatabase(): Promise<void> {
  if (!databaseUrl) return;
  await getDb().delete(users).where(inArray(users.id, [primaryUserId, otherUserId]));
}

describe("database-backed authentication", () => {
  before(async () => {
    if (!databaseUrl) return;
    await cleanDatabase();
    await getDb().insert(users).values([
      {
        id: primaryUserId,
        username: "auth-primary-081",
        passwordHash: await hashPassword("correct horse battery staple"),
        email: "primary@example.com",
        status: "active",
      },
      {
        id: otherUserId,
        username: "other-user",
        passwordHash: await hashPassword("other password"),
        email: "other@example.com",
        status: "active",
      },
    ]);
  });

  after(async () => {
    await cleanDatabase();
    await closeDb();
  });

  it("hashes passwords and rejects wrong or empty values", async () => {
    const hash = await hashPassword("correct horse battery staple");
    assert.notEqual(hash, "correct horse battery staple");
    assert.equal(await verifyPassword("correct horse battery staple", hash), true);
    assert.equal(await verifyPassword("wrong password", hash), false);
    assert.equal(await verifyPassword("", hash), false);
    assert.equal(await verifyPassword("password", null), false);
  });

  it("normalizes usernames without changing validation boundaries", () => {
    assert.equal(normalizeUsername("  Auth-Primary-081  "), "auth-primary-081");
    assert.equal(isValidUsername("abc"), true);
    assert.equal(isValidUsername("ab"), false);
    assert.equal(isValidUsername("   "), false);
  });

  it("authenticates active users and rejects wrong credentials", databaseTestOptions, async () => {
    const [user] = await getDb()
      .select()
      .from(users)
      .where(eq(users.username, normalizeUsername("  AUTH-PRIMARY-081 ")))
      .limit(1);
    assert.ok(user);
    assert.equal(user.status, "active");
    assert.equal(await verifyPassword("correct horse battery staple", user.passwordHash), true);
    assert.equal(await verifyPassword("wrong password", user.passwordHash), false);
    assert.deepEqual(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
      },
      {
        id: primaryUserId,
        username: "auth-primary-081",
        email: "primary@example.com",
        displayName: null,
      },
    );
    const [missing] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, "missing-auth-user"))
      .limit(1);
    assert.equal(missing, undefined);
  });

  it("supports independent multi-device sessions and revokes only one device", databaseTestOptions, async () => {
    const now = new Date();
    const deviceAToken = createSessionToken();
    const deviceBToken = createSessionToken();
    assert.notEqual(deviceAToken, deviceBToken);

    await getDb().insert(sessions).values([
      {
        userId: primaryUserId,
        tokenHash: hashSessionToken(deviceAToken),
        expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
      },
      {
        userId: primaryUserId,
        tokenHash: hashSessionToken(deviceBToken),
        expiresAt: new Date(now.getTime() + SESSION_TTL_SECONDS * 1000),
      },
    ]);

    const activeSessionUser = async (token: string): Promise<string | null> => {
      const [row] = await getDb()
        .select({ userId: sessions.userId })
        .from(sessions)
        .where(
          and(
            eq(sessions.tokenHash, hashSessionToken(token)),
            isNull(sessions.revokedAt),
            gt(sessions.expiresAt, new Date()),
          ),
        )
        .limit(1);
      return row?.userId ?? null;
    };

    assert.equal(await activeSessionUser(deviceAToken), primaryUserId);
    assert.equal(await activeSessionUser(deviceBToken), primaryUserId);

    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(sessions.userId, primaryUserId),
          eq(sessions.tokenHash, hashSessionToken(deviceAToken)),
        ),
      );

    assert.equal(await activeSessionUser(deviceAToken), null);
    assert.equal(await activeSessionUser(deviceBToken), primaryUserId);
    const remaining = await getDb()
      .select({ id: sessions.id })
      .from(sessions)
      .where(eq(sessions.userId, primaryUserId));
    assert.equal(remaining.length >= 2, true);
  });

  it("rejects expired sessions and never stores a raw token", databaseTestOptions, async () => {
    const token = createSessionToken();
    await getDb().insert(sessions).values({
      userId: primaryUserId,
      tokenHash: hashSessionToken(token),
      expiresAt: new Date(Date.now() - 1_000),
    });
    const [active] = await getDb()
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.tokenHash, hashSessionToken(token)),
          isNull(sessions.revokedAt),
          gt(sessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    assert.equal(active, undefined);
    assert.notEqual(hashSessionToken(token), token);
  });
});

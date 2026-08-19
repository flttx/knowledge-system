import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { users } from "@/db/schema";
import { normalizeUsername } from "@/lib/auth/config";
import { verifyPassword } from "@/lib/auth/password";
import type { AuthUser } from "@/lib/auth/types";

export async function authenticateUser(
  usernameValue: string,
  password: string,
): Promise<AuthUser | null> {
  const username = normalizeUsername(usernameValue);
  if (!username || !password) {
    return null;
  }

  const [user] = await getDb()
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);

  if (!user || user.status !== "active" || !user.username) {
    return null;
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
  };
}

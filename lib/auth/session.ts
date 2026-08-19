import { createHash, randomBytes } from "node:crypto";

import { SESSION_COOKIE_NAME } from "./constants";

export { SESSION_COOKIE_NAME };
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

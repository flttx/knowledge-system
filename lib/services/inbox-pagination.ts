import { and, eq, lt, lte, or } from "drizzle-orm";
import { ValidationError } from "./errors";

export const inboxTypes = ["ai_suggestion", "highlight", "quick_note", "screenshot"] as const;
export interface InboxBoundary { createdAt: Date; type: typeof inboxTypes[number]; id: string }
export function encodeInboxCursor(item: InboxBoundary): string {
  return Buffer.from(JSON.stringify([item.createdAt.toISOString(), item.type, item.id])).toString("base64url");
}
export function decodeInboxCursor(value?: string): InboxBoundary | undefined {
  if (!value) return;
  try {
    const parts = JSON.parse(Buffer.from(value, "base64url").toString());
    if (!Array.isArray(parts) || parts.length !== 3) throw new Error();
    const [date, type, id] = parts;
    if (typeof date !== "string" || Number.isNaN(Date.parse(date)) || !inboxTypes.includes(type) || typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) throw new Error();
    return { createdAt: new Date(date), type, id };
  } catch { throw new ValidationError({ cursor: ["Invalid inbox cursor"] }); }
}
export function compareInbox(left: InboxBoundary, right: InboxBoundary): number {
  return right.createdAt.getTime() - left.createdAt.getTime() || (left.type < right.type ? 1 : left.type > right.type ? -1 : left.id < right.id ? 1 : left.id > right.id ? -1 : 0);
}
export function inboxAfter(date: Parameters<typeof lt>[0], id: Parameters<typeof lt>[0], type: InboxBoundary["type"], cursor?: InboxBoundary) {
  if (!cursor) return undefined;
  if (type < cursor.type) return lte(date, cursor.createdAt);
  if (type > cursor.type) return lt(date, cursor.createdAt);
  return or(lt(date, cursor.createdAt), and(eq(date, cursor.createdAt), lt(id, cursor.id)));
}

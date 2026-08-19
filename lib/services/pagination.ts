import { and, eq, lt, or, sql } from "drizzle-orm";

import { ValidationError } from "@/lib/services/errors";

export interface PageOptions {
  cursor?: string;
  limit?: number;
}

export interface CursorValue {
  createdAt: Date;
  id: string;
}

export function getLimit(limit: number | undefined, fallback = 20): number {
  if (limit === undefined) {
    return fallback;
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError({ limit: ["limit 必须是 1 到 100 之间的整数。"] });
  }

  return limit;
}

export function decodeCursor(cursor: string | undefined): CursorValue | undefined {
  if (!cursor) {
    return undefined;
  }

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const separator = decoded.indexOf("|");
    const createdAt = new Date(decoded.slice(0, separator));
    const id = decoded.slice(separator + 1);

    if (separator <= 0 || !id || Number.isNaN(createdAt.getTime())) {
      throw new Error("Invalid cursor");
    }

    return { createdAt, id };
  } catch {
    throw new ValidationError({ cursor: ["cursor 无效。"] });
  }
}

export function encodeCursor(value: CursorValue): string {
  return Buffer.from(`${value.createdAt.toISOString()}|${value.id}`).toString(
    "base64url",
  );
}

export function afterCursor(
  createdAtColumn: Parameters<typeof lt>[0],
  idColumn: Parameters<typeof lt>[0],
  cursor: CursorValue | undefined,
) {
  if (!cursor) {
    return undefined;
  }

  return or(
    lt(createdAtColumn, cursor.createdAt),
    and(eq(createdAtColumn, cursor.createdAt), lt(idColumn, cursor.id)),
  );
}

export function notArchived(column: Parameters<typeof eq>[0]) {
  return sql`${column} is distinct from 'archived'`;
}

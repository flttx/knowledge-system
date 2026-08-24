import { del, get, put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";

import { getDb } from "@/db";
import { attachments } from "@/db/schema";
import { NotFoundError, ValidationError } from "@/lib/services/errors";

export const SCREENSHOT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;

export type ScreenshotMimeType = (typeof SCREENSHOT_MIME_TYPES)[number];

function isScreenshotMimeType(value: string): value is ScreenshotMimeType {
  return (SCREENSHOT_MIME_TYPES as readonly string[]).includes(value);
}

function getBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }
  return token;
}

async function requireOwnedAttachment(
  userId: string,
  attachmentId: string,
): Promise<typeof attachments.$inferSelect> {
  const [attachment] = await getDb()
    .select()
    .from(attachments)
    .where(and(eq(attachments.id, attachmentId), eq(attachments.userId, userId)))
    .limit(1);

  if (!attachment) throw new NotFoundError("找不到请求的附件。");
  return attachment;
}

export async function createImageAttachment(
  userId: string,
  file: File,
): Promise<typeof attachments.$inferSelect> {
  if (!isScreenshotMimeType(file.type)) {
    throw new ValidationError({ image: ["只支持 PNG、JPEG 或 WebP 图片。"] });
  }
  if (file.size <= 0 || file.size > MAX_SCREENSHOT_BYTES) {
    throw new ValidationError({ image: ["图片大小必须在 1B 到 10MB 之间。"] });
  }

  const pathname = `screenshots/${userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const blob = await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type,
    token: getBlobToken(),
  });

  try {
    const [attachment] = await getDb()
      .insert(attachments)
      .values({
        userId,
        storageKey: blob.pathname,
        fileName: file.name || "screenshot",
        mimeType: file.type,
        sizeBytes: file.size,
      })
      .returning();

    if (!attachment) throw new Error("附件创建失败。");
    return attachment;
  } catch (error: unknown) {
    await del(blob.url, { token: getBlobToken() }).catch(() => undefined);
    throw error;
  }
}

export async function getOwnedAttachment(
  userId: string,
  attachmentId: string,
): Promise<typeof attachments.$inferSelect> {
  return requireOwnedAttachment(userId, attachmentId);
}

export async function readOwnedAttachment(
  userId: string,
  attachmentId: string,
): Promise<{ body: ReadableStream<Uint8Array>; mimeType: string }> {
  const attachment = await requireOwnedAttachment(userId, attachmentId);
  const blob = await get(attachment.storageKey, {
    access: "private",
    token: getBlobToken(),
  });

  if (!blob || blob.statusCode !== 200 || !blob.stream) throw new NotFoundError("找不到请求的附件文件。");
  return { body: blob.stream, mimeType: attachment.mimeType };
}

export async function deleteOwnedAttachment(
  userId: string,
  attachmentId: string,
): Promise<void> {
  const attachment = await requireOwnedAttachment(userId, attachmentId);
  await del(attachment.storageKey, { token: getBlobToken() });
  await getDb()
    .delete(attachments)
    .where(and(eq(attachments.id, attachmentId), eq(attachments.userId, userId)));
}

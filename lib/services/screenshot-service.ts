import { and, desc, eq, isNull, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { attachments, notes, screenshots, sources } from "@/db/schema";
import { createImageAttachment, deleteOwnedAttachment, getOwnedAttachment, SCREENSHOT_MIME_TYPES } from "@/lib/services/attachment-service";
import { NotFoundError, ValidationError } from "@/lib/services/errors";
import { afterCursor, decodeCursor, encodeCursor, getLimit } from "@/lib/services/pagination";
import {
  createScreenshotSchema,
  parseSchema,
  updateScreenshotSchema,
  type InboxStatus,
} from "@/lib/services/validation";

export interface ListScreenshotsOptions {
  cursor?: string;
  limit?: number;
  status?: InboxStatus;
  sourceId?: string;
}

export interface ScreenshotItem {
  id: string;
  attachmentId: string;
  imageUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  sourceId: string | null;
  sourceTitle: string | null;
  noteId: string | null;
  noteTitle: string | null;
  page: string | null;
  location: string | null;
  annotation: string | null;
  extractedText: string | null;
  status: InboxStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export interface ScreenshotPage {
  items: ScreenshotItem[];
  nextCursor: string | null;
}

function screenshotScope(userId: string, screenshotId: string) {
  return and(eq(screenshots.id, screenshotId), eq(screenshots.userId, userId));
}

async function requireOwnedSource(userId: string, sourceId: string): Promise<void> {
  const [source] = await getDb()
    .select({ id: sources.id })
    .from(sources)
    .where(and(eq(sources.id, sourceId), eq(sources.userId, userId)))
    .limit(1);
  if (!source) throw new NotFoundError("找不到请求的来源。");
}

async function requireOwnedNote(userId: string, noteId: string): Promise<void> {
  const [note] = await getDb()
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
    .limit(1);
  if (!note) throw new NotFoundError("找不到请求的笔记。");
}

async function requireScreenshotAttachment(userId: string, attachmentId: string): Promise<void> {
  const attachment = await getOwnedAttachment(userId, attachmentId);
  if (!(SCREENSHOT_MIME_TYPES as readonly string[]).includes(attachment.mimeType)) {
    throw new ValidationError({ attachmentId: ["附件必须是 PNG、JPEG 或 WebP 图片。"] });
  }
}

function toScreenshotItem(
  row: {
    screenshot: typeof screenshots.$inferSelect;
    attachment: typeof attachments.$inferSelect;
    sourceTitle: string | null;
    noteTitle: string | null;
  },
): ScreenshotItem {
  return {
    id: row.screenshot.id,
    attachmentId: row.screenshot.attachmentId,
    imageUrl: `/api/attachments/${row.screenshot.attachmentId}`,
    fileName: row.attachment.fileName,
    mimeType: row.attachment.mimeType,
    sizeBytes: row.attachment.sizeBytes,
    sourceId: row.screenshot.sourceId,
    sourceTitle: row.sourceTitle,
    noteId: row.screenshot.noteId,
    noteTitle: row.noteTitle,
    page: row.screenshot.page,
    location: row.screenshot.location,
    annotation: row.screenshot.annotation,
    extractedText: row.screenshot.extractedText,
    status: row.screenshot.status as InboxStatus,
    createdAt: row.screenshot.createdAt,
    updatedAt: row.screenshot.updatedAt,
    archivedAt: row.screenshot.archivedAt,
  };
}

async function findScreenshot(userId: string, screenshotId: string): Promise<ScreenshotItem> {
  const [row] = await getDb()
    .select({
      screenshot: screenshots,
      attachment: attachments,
      sourceTitle: sources.title,
      noteTitle: notes.title,
    })
    .from(screenshots)
    .innerJoin(attachments, and(eq(screenshots.attachmentId, attachments.id), eq(attachments.userId, userId)))
    .leftJoin(sources, and(eq(screenshots.sourceId, sources.id), eq(sources.userId, userId)))
    .leftJoin(notes, and(eq(screenshots.noteId, notes.id), eq(notes.userId, userId)))
    .where(screenshotScope(userId, screenshotId))
    .limit(1);
  if (!row) throw new NotFoundError("找不到请求的截图摘录。");
  return toScreenshotItem(row);
}

export async function createScreenshot(userId: string, input: unknown): Promise<ScreenshotItem> {
  const values = parseSchema(createScreenshotSchema, input);
  await requireScreenshotAttachment(userId, values.attachmentId);
  if (values.sourceId) await requireOwnedSource(userId, values.sourceId);
  if (values.noteId) await requireOwnedNote(userId, values.noteId);

  const [screenshot] = await getDb()
    .insert(screenshots)
    .values({
      userId,
      attachmentId: values.attachmentId,
      sourceId: values.sourceId ?? null,
      noteId: values.noteId ?? null,
      page: values.page ?? null,
      location: values.location ?? null,
      annotation: values.annotation ?? null,
      extractedText: values.extractedText ?? null,
      status: values.status ?? "inbox",
      archivedAt: values.status === "archived" ? new Date() : null,
    })
    .returning();
  if (!screenshot) throw new Error("截图摘录创建失败。");
  return findScreenshot(userId, screenshot.id);
}

export async function createScreenshotFromFile(
  userId: string,
  file: File,
  metadata: unknown,
): Promise<ScreenshotItem> {
  const attachment = await createImageAttachment(userId, file);
  try {
    const metadataRecord = typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)
      ? metadata as Record<string, unknown>
      : {};
    return await createScreenshot(userId, { ...metadataRecord, attachmentId: attachment.id });
  } catch (error: unknown) {
    await deleteOwnedAttachment(userId, attachment.id).catch(() => undefined);
    throw error;
  }
}

export async function listScreenshots(userId: string, options: ListScreenshotsOptions = {}): Promise<ScreenshotPage> {
  const limit = getLimit(options.limit);
  const cursor = decodeCursor(options.cursor);
  const conditions = [eq(screenshots.userId, userId)];
  if (options.status) conditions.push(eq(screenshots.status, options.status));
  else {
    conditions.push(ne(screenshots.status, "archived"));
    conditions.push(isNull(screenshots.archivedAt));
  }
  if (options.sourceId) conditions.push(eq(screenshots.sourceId, options.sourceId));
  const cursorCondition = afterCursor(screenshots.createdAt, screenshots.id, cursor);
  if (cursorCondition) conditions.push(cursorCondition);

  const rows = await getDb()
    .select({ screenshot: screenshots, attachment: attachments, sourceTitle: sources.title, noteTitle: notes.title })
    .from(screenshots)
    .innerJoin(attachments, and(eq(screenshots.attachmentId, attachments.id), eq(attachments.userId, userId)))
    .leftJoin(sources, and(eq(screenshots.sourceId, sources.id), eq(sources.userId, userId)))
    .leftJoin(notes, and(eq(screenshots.noteId, notes.id), eq(notes.userId, userId)))
    .where(and(...conditions))
    .orderBy(desc(screenshots.createdAt), desc(screenshots.id))
    .limit(limit + 1);
  const hasNext = rows.length > limit;
  const items = rows.slice(0, limit).map(toScreenshotItem);
  const last = items.at(-1);
  return { items, nextCursor: hasNext && last ? encodeCursor(last) : null };
}

export async function getScreenshot(userId: string, screenshotId: string): Promise<ScreenshotItem> {
  return findScreenshot(userId, screenshotId);
}

export async function updateScreenshot(userId: string, screenshotId: string, input: unknown): Promise<ScreenshotItem> {
  const values = parseSchema(updateScreenshotSchema, input);
  await findScreenshot(userId, screenshotId);
  if (values.sourceId) await requireOwnedSource(userId, values.sourceId);
  if (values.noteId) await requireOwnedNote(userId, values.noteId);
  const update: Partial<typeof screenshots.$inferInsert> = { updatedAt: new Date() };
  if (values.sourceId !== undefined) update.sourceId = values.sourceId;
  if (values.noteId !== undefined) update.noteId = values.noteId;
  if (values.page !== undefined) update.page = values.page;
  if (values.location !== undefined) update.location = values.location;
  if (values.annotation !== undefined) update.annotation = values.annotation;
  if (values.extractedText !== undefined) update.extractedText = values.extractedText;
  if (values.status !== undefined) {
    update.status = values.status;
    update.archivedAt = values.status === "archived" ? new Date() : null;
  }
  await getDb().update(screenshots).set(update).where(screenshotScope(userId, screenshotId));
  return findScreenshot(userId, screenshotId);
}

export async function archiveScreenshot(userId: string, screenshotId: string): Promise<ScreenshotItem> {
  await findScreenshot(userId, screenshotId);
  await getDb().update(screenshots).set({ status: "archived", archivedAt: new Date(), updatedAt: new Date() }).where(screenshotScope(userId, screenshotId));
  return findScreenshot(userId, screenshotId);
}

export async function restoreScreenshot(userId: string, screenshotId: string): Promise<ScreenshotItem> {
  await findScreenshot(userId, screenshotId);
  await getDb().update(screenshots).set({ status: "inbox", archivedAt: null, updatedAt: new Date() }).where(screenshotScope(userId, screenshotId));
  return findScreenshot(userId, screenshotId);
}

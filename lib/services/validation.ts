import { z } from "zod";

import { ValidationError } from "@/lib/services/errors";

export const sourceTypes = [
  "article",
  "magazine",
  "pdf",
  "book",
  "web",
  "other",
] as const;

export const inboxStatuses = ["inbox", "processed", "archived"] as const;

const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

export const createSourceSchema = z.object({
  title: z.string().trim().min(1).max(500),
  publication: optionalText(300),
  author: optionalText(300),
  issue: optionalText(200),
  sourceType: z.enum(sourceTypes),
  url: z.string().trim().url().max(2000).nullable().optional(),
  publishedAt: z.coerce.date().nullable().optional(),
});

export const updateSourceSchema = createSourceSchema.partial();

export const createHighlightSchema = z.object({
  text: z.string().trim().min(1).max(20000),
  sourceId: z.string().uuid().nullable().optional(),
  page: z.number().int().positive().nullable().optional(),
  location: optionalText(500),
  personalComment: optionalText(10000),
  status: z.enum(inboxStatuses).optional(),
});

export const updateHighlightSchema = createHighlightSchema.partial();

export const createQuickNoteSchema = z.object({
  content: z.string().trim().min(1).max(20000),
  sourceId: z.string().uuid().nullable().optional(),
  status: z.enum(inboxStatuses).optional(),
});

export const updateQuickNoteSchema = createQuickNoteSchema.partial();

export const createScreenshotSchema = z.object({
  attachmentId: z.string().uuid(),
  sourceId: z.string().uuid().nullable().optional(),
  noteId: z.string().uuid().nullable().optional(),
  page: optionalText(100),
  location: optionalText(500),
  annotation: optionalText(10000),
  extractedText: optionalText(20000),
  status: z.enum(inboxStatuses).optional(),
});

export const updateScreenshotSchema = createScreenshotSchema
  .omit({ attachmentId: true })
  .partial();

const tagNamesSchema = z
  .array(z.string().trim().min(1).max(80))
  .max(30)
  .optional();

export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(500),
  contentMarkdown: z.string().max(500000).optional().default(""),
  tagNames: tagNamesSchema,
});

export const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  contentMarkdown: z.string().max(500000).optional(),
  tagNames: tagNamesSchema,
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors);
  }

  return result.data;
}

export type SourceType = (typeof sourceTypes)[number];
export type InboxStatus = (typeof inboxStatuses)[number];
export type CreateSourceInput = z.infer<typeof createSourceSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type CreateHighlightInput = z.infer<typeof createHighlightSchema>;
export type UpdateHighlightInput = z.infer<typeof updateHighlightSchema>;
export type CreateQuickNoteInput = z.infer<typeof createQuickNoteSchema>;
export type UpdateQuickNoteInput = z.infer<typeof updateQuickNoteSchema>;
export type CreateScreenshotInput = z.infer<typeof createScreenshotSchema>;
export type UpdateScreenshotInput = z.infer<typeof updateScreenshotSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type CreateTagInput = z.infer<typeof createTagSchema>;

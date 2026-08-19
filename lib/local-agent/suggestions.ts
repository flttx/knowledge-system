import { z } from "zod";

import { localRelationTypes } from "./relation";

export const suggestionSourceReferenceSchema = z
  .object({
    type: z.enum(["highlight", "quick_note"]),
    id: z.string().uuid(),
  })
  .strict();

const uniqueSourceReferencesSchema = z
  .array(suggestionSourceReferenceSchema)
  .min(1)
  .max(100)
  .superRefine((references, context) => {
    const seen = new Set<string>();
    references.forEach((reference, index) => {
      const key = `${reference.type}:${reference.id}`;
      if (seen.has(key)) {
        context.addIssue({
          code: "custom",
          message: "Source references must be unique.",
          path: [index],
        });
      }
      seen.add(key);
    });
  });

const suggestionBaseSchema = z.object({
  version: z.literal(1),
  id: z.string().trim().min(1).max(200),
  sourceReferences: uniqueSourceReferencesSchema,
});

export const inboxGroupSuggestionSchema = suggestionBaseSchema
  .extend({
    type: z.literal("inbox_group"),
    proposedTitle: z.string().trim().min(1).max(500),
    reason: z.string().trim().min(1).max(5000),
    themes: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  })
  .strict();

export const durableNoteSuggestionSchema = suggestionBaseSchema
  .extend({
    type: z.literal("durable_note"),
    proposedTitle: z.string().trim().min(1).max(500),
    summary: z.string().trim().min(1).max(5000),
    bodyMarkdown: z.string().min(1).max(500000),
    suggestedTags: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  })
  .strict();

export const relationSuggestionSchema = z
  .object({
    version: z.literal(1),
    type: z.literal("relation"),
    id: z.string().trim().min(1).max(200),
    sourceNoteId: z.string().uuid(),
    targetNoteId: z.string().uuid(),
    relationType: z.enum(localRelationTypes),
    reason: z.string().trim().min(1).max(5000),
    confidence: z.number().min(0).max(1),
  })
  .strict()
  .superRefine((suggestion, context) => {
    if (suggestion.sourceNoteId === suggestion.targetNoteId) {
      context.addIssue({
        code: "custom",
        message: "A relation cannot connect a Note to itself.",
        path: ["targetNoteId"],
      });
    }
  });

export const localSuggestionSchema = z.discriminatedUnion("type", [
  inboxGroupSuggestionSchema,
  durableNoteSuggestionSchema,
  relationSuggestionSchema,
]);

export const suggestionImportRequestSchema = z.object({
  suggestions: z.array(localSuggestionSchema).min(1).max(100),
});

export const acceptDurableNoteSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  bodyMarkdown: z.string().min(1).max(500000).optional(),
  tagNames: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
});

export type SuggestionSourceReference = z.infer<typeof suggestionSourceReferenceSchema>;
export type InboxGroupSuggestion = z.infer<typeof inboxGroupSuggestionSchema>;
export type DurableNoteSuggestion = z.infer<typeof durableNoteSuggestionSchema>;
export type RelationSuggestion = z.infer<typeof relationSuggestionSchema>;
export type LocalSuggestion = z.infer<typeof localSuggestionSchema>;
export type SuggestionImportRequest = z.infer<typeof suggestionImportRequestSchema>;
export type AcceptDurableNoteInput = z.infer<typeof acceptDurableNoteSchema>;

export function parseLocalSuggestion(value: unknown): LocalSuggestion {
  return localSuggestionSchema.parse(value);
}

export function parseSuggestionImportRequest(value: unknown): SuggestionImportRequest {
  return suggestionImportRequestSchema.parse(value);
}

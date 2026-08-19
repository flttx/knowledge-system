import { z } from "zod";

export const localAgentScopes = ["inbox", "notes", "all"] as const;
export type LocalAgentScope = (typeof localAgentScopes)[number];

export const localAgentPullRequestSchema = z.object({
  scope: z.enum(localAgentScopes).default("all"),
});

export interface LocalAgentSource {
  id: string;
  title: string;
  publication: string | null;
  author: string | null;
  issue: string | null;
  sourceType: string;
  url: string | null;
  publishedAt: string | null;
  archivedAt: string | null;
}

export interface LocalAgentHighlight {
  id: string;
  sourceId: string | null;
  text: string;
  page: number | null;
  location: string | null;
  personalComment: string | null;
  status: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAgentQuickNote {
  id: string;
  sourceId: string | null;
  content: string;
  status: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAgentNote {
  id: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface LocalAgentRelation {
  id: string;
  sourceNoteId: string;
  targetNoteId: string;
  relationType: string;
  status: "confirmed" | "rejected";
  reason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalAgentPullResponse {
  version: 1;
  scope: LocalAgentScope;
  generatedAt: string;
  inbox: {
    highlights: LocalAgentHighlight[];
    quickNotes: LocalAgentQuickNote[];
  };
  sources: LocalAgentSource[];
  notes: LocalAgentNote[];
  relations: LocalAgentRelation[];
  counts: {
    highlights: number;
    quickNotes: number;
    sources: number;
    notes: number;
    relations: number;
  };
}

export interface LocalAgentStatusResponse {
  version: 1;
  authenticated: true;
  scopes: LocalAgentScope[];
}

const dateValue = z.string().datetime({ offset: true });
const nullableDateValue = dateValue.nullable();

const sourceValueSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  publication: z.string().nullable(),
  author: z.string().nullable(),
  issue: z.string().nullable(),
  sourceType: z.string(),
  url: z.string().nullable(),
  publishedAt: nullableDateValue,
  archivedAt: nullableDateValue,
});

const highlightValueSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid().nullable(),
  text: z.string(),
  page: z.number().int().nullable(),
  location: z.string().nullable(),
  personalComment: z.string().nullable(),
  status: z.string(),
  archivedAt: nullableDateValue,
  createdAt: dateValue,
  updatedAt: dateValue,
});

const quickNoteValueSchema = z.object({
  id: z.string().uuid(),
  sourceId: z.string().uuid().nullable(),
  content: z.string(),
  status: z.string(),
  archivedAt: nullableDateValue,
  createdAt: dateValue,
  updatedAt: dateValue,
});

const noteValueSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  contentMarkdown: z.string(),
  tags: z.array(z.string()),
  createdAt: dateValue,
  updatedAt: dateValue,
  archivedAt: nullableDateValue,
});

const relationValueSchema = z.object({
  id: z.string().uuid(),
  sourceNoteId: z.string().uuid(),
  targetNoteId: z.string().uuid(),
  relationType: z.string(),
  status: z.enum(["confirmed", "rejected"]),
  reason: z.string().nullable(),
  createdAt: dateValue,
  updatedAt: dateValue,
});

export const localAgentPullResponseSchema = z.object({
  version: z.literal(1),
  scope: z.enum(localAgentScopes),
  generatedAt: dateValue,
  inbox: z.object({
    highlights: z.array(highlightValueSchema),
    quickNotes: z.array(quickNoteValueSchema),
  }),
  sources: z.array(sourceValueSchema),
  notes: z.array(noteValueSchema),
  relations: z.array(relationValueSchema),
  counts: z.object({
    highlights: z.number().int().nonnegative(),
    quickNotes: z.number().int().nonnegative(),
    sources: z.number().int().nonnegative(),
    notes: z.number().int().nonnegative(),
    relations: z.number().int().nonnegative(),
  }),
});

export function parseLocalAgentPullResponse(
  value: unknown,
): LocalAgentPullResponse {
  return localAgentPullResponseSchema.parse(value) as LocalAgentPullResponse;
}

import {
  and,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { getDb } from "@/db";
import { highlights, noteTags, notes, sources, tags } from "@/db/schema";
import { ValidationError } from "@/lib/services/errors";
import { getLimit } from "@/lib/services/pagination";
import type {
  SearchResult,
  SearchResultType,
  SearchType,
  TitleSearchResult,
} from "@/lib/search/types";

export const MAX_SEARCH_LIMIT = 50;
const MAX_QUERY_LENGTH = 200;

export interface SearchOptions {
  type?: SearchType;
  limit?: number;
}

function normalizeQuery(value: string): string {
  const query = value.trim();
  if (query.length > MAX_QUERY_LENGTH) {
    throw new ValidationError({ q: [`q cannot exceed ${MAX_QUERY_LENGTH} characters.`] });
  }
  return query;
}

function getSearchLimit(value: number | undefined): number {
  const limit = getLimit(value, 20);
  return Math.min(MAX_SEARCH_LIMIT, limit);
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function lowerEquals(column: unknown, query: string) {
  return sql`lower(${column}) = lower(${query})`;
}

function lowerStartsWith(column: unknown, query: string) {
  return sql`lower(${column}) like lower(${`${escapeLike(query)}%`}) escape '\\'`;
}

function simpleFts(column: unknown, query: string) {
  return sql`to_tsvector('simple', coalesce(${column}, '')) @@ websearch_to_tsquery('simple', ${query})`;
}

function contains(column: Parameters<typeof ilike>[0], query: string) {
  return ilike(column, `%${escapeLike(query)}%`);
}

function toScore(value: unknown): number {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

function mergeSearchResults(
  results: SearchResult[][],
  limit: number,
): SearchResult[] {
  return results
    .flat()
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (left.type !== right.type) return left.type.localeCompare(right.type);
      return left.title.localeCompare(right.title);
    })
    .slice(0, limit);
}

async function searchNotes(
  userId: string,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const titleContains = contains(notes.title, query);
  const contentContains = contains(notes.contentMarkdown, query);
  const titleFts = simpleFts(notes.title, query);
  const contentFts = simpleFts(notes.contentMarkdown, query);
  const titleExact = lowerEquals(notes.title, query);
  const titlePrefix = lowerStartsWith(notes.title, query);
  const score = sql<number>`case
    when ${titleExact} then 1.0
    when ${titlePrefix} then 0.95
    when ${titleFts} then 0.85
    when ${titleContains} then 0.8
    when ${contentFts} then 0.7
    else 0.55
  end`;
  const snippet = sql<string>`case
    when ${titleContains} then left(${notes.title}, 180)
    when ${contentContains} then left(${notes.contentMarkdown}, 240)
    else ts_headline('simple', coalesce(${notes.contentMarkdown}, ''), websearch_to_tsquery('simple', ${query}), 'MaxWords=28, MinWords=8')
  end`;

  const rows = await getDb()
    .select({
      id: notes.id,
      title: notes.title,
      snippet,
      score,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(
      and(
        eq(notes.userId, userId),
        isNull(notes.archivedAt),
        or(titleContains, contentContains, titleFts, contentFts),
      ),
    )
    .orderBy(desc(score), desc(notes.updatedAt), desc(notes.id))
    .limit(limit);

  return rows.map((row) => ({
    type: "note",
    id: row.id,
    title: row.title,
    snippet: row.snippet ?? "",
    score: toScore(row.score),
  }));
}

async function searchSources(
  userId: string,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const titleContains = contains(sources.title, query);
  const publicationContains = contains(sources.publication, query);
  const authorContains = contains(sources.author, query);
  const titleFts = simpleFts(sources.title, query);
  const publicationFts = simpleFts(sources.publication, query);
  const authorFts = simpleFts(sources.author, query);
  const titleExact = lowerEquals(sources.title, query);
  const titlePrefix = lowerStartsWith(sources.title, query);
  const score = sql<number>`case
    when ${titleExact} then 1.0
    when ${titlePrefix} then 0.95
    when ${titleFts} then 0.85
    when ${titleContains} then 0.8
    when ${publicationFts} then 0.7
    when ${publicationContains} then 0.65
    when ${authorFts} then 0.6
    else 0.55
  end`;
  const snippet = sql<string>`case
    when ${titleContains} then left(${sources.title}, 180)
    when ${publicationContains} then left(coalesce(${sources.publication}, ''), 180)
    when ${authorContains} then left(coalesce(${sources.author}, ''), 180)
    else ts_headline('simple', concat_ws(' ', ${sources.title}, ${sources.publication}, ${sources.author}), websearch_to_tsquery('simple', ${query}), 'MaxWords=28, MinWords=8')
  end`;

  const rows = await getDb()
    .select({
      id: sources.id,
      title: sources.title,
      snippet,
      score,
      updatedAt: sources.updatedAt,
    })
    .from(sources)
    .where(
      and(
        eq(sources.userId, userId),
        isNull(sources.archivedAt),
        or(
          titleContains,
          publicationContains,
          authorContains,
          titleFts,
          publicationFts,
          authorFts,
        ),
      ),
    )
    .orderBy(desc(score), desc(sources.updatedAt), desc(sources.id))
    .limit(limit);

  return rows.map((row) => ({
    type: "source",
    id: row.id,
    title: row.title,
    snippet: row.snippet ?? "",
    score: toScore(row.score),
  }));
}

async function searchHighlights(
  userId: string,
  query: string,
  limit: number,
): Promise<SearchResult[]> {
  const textContains = contains(highlights.text, query);
  const commentContains = contains(highlights.personalComment, query);
  const textFts = simpleFts(highlights.text, query);
  const commentFts = simpleFts(highlights.personalComment, query);
  const score = sql<number>`case
    when ${textFts} then 0.9
    when ${textContains} then 0.85
    when ${commentFts} then 0.7
    else 0.6
  end`;
  const snippet = sql<string>`case
    when ${textContains} then left(${highlights.text}, 240)
    when ${commentContains} then left(coalesce(${highlights.personalComment}, ''), 240)
    else ts_headline('simple', concat_ws(' ', ${highlights.text}, ${highlights.personalComment}), websearch_to_tsquery('simple', ${query}), 'MaxWords=28, MinWords=8')
  end`;

  const rows = await getDb()
    .select({
      id: highlights.id,
      sourceId: highlights.sourceId,
      sourceTitle: sources.title,
      snippet,
      score,
      createdAt: highlights.createdAt,
    })
    .from(highlights)
    .leftJoin(
      sources,
      and(eq(highlights.sourceId, sources.id), eq(sources.userId, userId)),
    )
    .where(
      and(
        eq(highlights.userId, userId),
        isNull(highlights.archivedAt),
        ne(highlights.status, "archived"),
        or(textContains, commentContains, textFts, commentFts),
      ),
    )
    .orderBy(desc(score), desc(highlights.createdAt), desc(highlights.id))
    .limit(limit);

  return rows.map((row) => ({
    type: "highlight",
    id: row.id,
    title: row.sourceTitle ?? "Highlight",
    snippet: row.snippet ?? "",
    score: toScore(row.score),
  }));
}

export async function search(
  userId: string,
  queryValue: string,
  options: SearchOptions = {},
): Promise<SearchResult[]> {
  const query = normalizeQuery(queryValue);
  if (!query) return [];

  const type = options.type ?? "all";
  const limit = getSearchLimit(options.limit);
  const searches: Promise<SearchResult[]>[] = [];
  if (type === "all" || type === "note") searches.push(searchNotes(userId, query, limit));
  if (type === "all" || type === "source") searches.push(searchSources(userId, query, limit));
  if (type === "all" || type === "highlight") searches.push(searchHighlights(userId, query, limit));
  return mergeSearchResults(await Promise.all(searches), limit);
}

export async function searchNoteTitles(
  userId: string,
  queryValue: string,
  limitValue?: number,
): Promise<TitleSearchResult[]> {
  const query = normalizeQuery(queryValue);
  if (!query) return [];
  const limit = getSearchLimit(limitValue);
  const titleContains = contains(notes.title, query);
  const titleExact = lowerEquals(notes.title, query);
  const titlePrefix = lowerStartsWith(notes.title, query);
  const rows = await getDb()
    .select({
      id: notes.id,
      title: notes.title,
      slug: notes.slug,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(eq(notes.userId, userId), isNull(notes.archivedAt), titleContains))
    .orderBy(sql`case when ${titleExact} then 0 when ${titlePrefix} then 1 else 2 end`, desc(notes.updatedAt), desc(notes.id))
    .limit(limit);

  const noteIds = rows.map((row) => row.id);
  const tagRows = noteIds.length === 0
    ? []
    : await getDb()
      .select({ noteId: noteTags.noteId, name: tags.name })
      .from(noteTags)
      .innerJoin(tags, and(eq(noteTags.tagId, tags.id), eq(tags.userId, userId)))
      .where(inArray(noteTags.noteId, noteIds));
  const tagMap = new Map<string, string[]>();
  for (const row of tagRows) {
    tagMap.set(row.noteId, [...(tagMap.get(row.noteId) ?? []), row.name]);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    tags: tagMap.get(row.id) ?? [],
  }));
}

export type { SearchResult, SearchResultType, SearchType, TitleSearchResult };

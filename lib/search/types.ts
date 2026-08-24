export const searchTypes = ["all", "note", "source", "highlight", "screenshot"] as const;

export type SearchType = (typeof searchTypes)[number];
export type SearchResultType = Exclude<SearchType, "all">;

export interface TitleSearchResult {
  id: string;
  title: string;
  slug: string;
  tags: string[];
}

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  snippet: string;
  score: number;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SearchResult, SearchType } from "@/lib/search/types";
import { useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader } from "@/components/ui/workspace";

interface SearchResponse {
  items: SearchResult[];
}

interface ApiErrorPayload {
  error?: { message?: string };
}

function resultHref(result: SearchResult): string {
  if (result.type === "note") return `/notes/${result.id}`;
  if (result.type === "source") return `/library/${result.id}`;
  return "/inbox";
}

function resultLabel(type: SearchResult["type"], t: (key: "search.notes" | "search.sources" | "search.highlights") => string): string {
  if (type === "note") return t("search.notes");
  if (type === "source") return t("search.sources");
  return t("search.highlights");
}

export function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const value = query.trim();
    if (!value) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setSearched(true);
      setError(null);
      void fetch(`/api/search?q=${encodeURIComponent(value)}&type=${type}&limit=20`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json()) as SearchResponse | ApiErrorPayload;
          if (!response.ok) {
            throw new Error((body as ApiErrorPayload).error?.message ?? t("search.error"));
          }
          setItems((body as SearchResponse).items);
        })
        .catch((fetchError: unknown) => {
          if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
          setItems([]);
          setError(fetchError instanceof Error ? fetchError.message : t("search.error"));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, t, type]);

  function handleQueryChange(value: string): void {
    setQuery(value);
    if (!value.trim()) {
      setItems([]);
      setLoading(false);
      setSearched(false);
      setError(null);
    }
  }

  return (
    <PageContainer width="list">
      <PageHeader className="items-start">
        <div>
        <p className="workspace-eyebrow">{t("search.eyebrow")}</p>
        <h1 className="workspace-page-title">{t("layout.searchTitle")}</h1>
        <p className="workspace-page-description">{t("layout.searchDescription")}</p>
        </div>
      </PageHeader>

      <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <label className="sr-only" htmlFor="search-query">{t("search.placeholder")}</label>
        <input
          autoComplete="off"
          className="workspace-input min-h-12 text-base"
          id="search-query"
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={t("search.placeholder")}
          value={query}
        />
        <label className="sr-only" htmlFor="search-type">{t("search.all")}</label>
        <select
          className="workspace-input min-h-12"
          id="search-type"
          onChange={(event) => setType(event.target.value as SearchType)}
          value={type}
        >
          <option value="all">{t("search.all")}</option>
          <option value="note">{t("search.notes")}</option>
          <option value="source">{t("search.sources")}</option>
          <option value="highlight">{t("search.highlights")}</option>
        </select>
      </div>

      <section aria-labelledby="search-results-heading" className="mt-8" aria-live="polite">
        <h2 className="sr-only" id="search-results-heading">{t("layout.searchTitle")}</h2>
        {!query.trim() ? <div className="workspace-empty">{t("search.empty")}</div> : null}
        {loading ? <div className="border-y border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]">{t("search.searching")}</div> : null}
        {error ? <div className="rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">{error}</div> : null}
        {!loading && !error && searched && items.length === 0 ? <div className="workspace-empty">{t("search.noResults")}</div> : null}
        {!loading && !error && items.length > 0 ? (
          <ul className="workspace-surface">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`}>
                <Link className="block px-4 py-4 transition-colors hover:bg-[var(--surface-muted)] sm:px-5" href={resultHref(item)}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--accent-strong)]">{resultLabel(item.type, t)}</span>
                    <span className="text-base font-semibold text-[var(--ink)]">{item.title}</span>
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--ink-muted)]">{item.snippet}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </PageContainer>
  );
}

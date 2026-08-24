"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge, EmptyState, PageContainer, PageHeader } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";

type SearchType = "all" | "note" | "source" | "highlight" | "screenshot";

interface SearchResultItem {
  id: string;
  type: "note" | "source" | "highlight" | "screenshot";
  title: string;
  snippet: string;
  updatedAt: string;
}

interface SearchResponse {
  items: SearchResultItem[];
}

function resultHref(item: SearchResultItem): string {
  if (item.type === "source") return `/library/${item.id}`;
  if (item.type === "highlight") return "/inbox";
  if (item.type === "screenshot") return "/inbox";
  return `/notes/${item.id}`;
}

function resultBadgeVariant(type: SearchResultItem["type"]): "default" | "accent" | "success" {
  if (type === "note") return "accent";
  if (type === "source") return "success";
  return "default";
}

function resultLabel(type: SearchResultItem["type"], translate: (key: "search.notes" | "search.sources" | "search.highlights" | "search.screenshots") => string): string {
  if (type === "source") return translate("search.sources");
  if (type === "highlight") return translate("search.highlights");
  if (type === "screenshot") return translate("search.screenshots");
  return translate("search.notes");
}

export function SearchPage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<SearchType>("all");
  const [items, setItems] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ q: trimmed, limit: "24" });
      if (type !== "all") params.set("type", type);

      fetch(`/api/search?${params.toString()}`, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error(t("search.error"));
          return (await response.json()) as SearchResponse;
        })
        .then((result) => {
          setItems(result.items);
          setSearched(true);
        })
        .catch((fetchError: unknown) => {
          if (controller.signal.aborted) return;
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

      <div className="mt-6 grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <label className="sr-only" htmlFor="search-query">{t("search.placeholder")}</label>
        <input
          autoComplete="off"
          className="workspace-input"
          id="search-query"
          onChange={(event) => handleQueryChange(event.target.value)}
          placeholder={t("search.placeholder")}
          value={query}
        />
        <label className="sr-only" htmlFor="search-type">{t("search.all")}</label>
        <select
          className="workspace-input"
          id="search-type"
          onChange={(event) => setType(event.target.value as SearchType)}
          value={type}
        >
          <option value="all">{t("search.all")}</option>
          <option value="note">{t("search.notes")}</option>
          <option value="source">{t("search.sources")}</option>
          <option value="highlight">{t("search.highlights")}</option>
          <option value="screenshot">{t("search.screenshots")}</option>
        </select>
      </div>

      <section aria-labelledby="search-results-heading" className="mt-6" aria-live="polite">
        <h2 className="sr-only" id="search-results-heading">{t("layout.searchTitle")}</h2>
        {!query.trim() ? (
          <EmptyState
            title="搜索全库知识"
            description="输入关键字快速检索笔记、资料库和高亮内容。"
          />
        ) : null}
        {loading ? (
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--ink-muted)]">
            {t("search.searching")}
          </div>
        ) : null}
        {error ? <div className="rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">{error}</div> : null}
        {!loading && !error && searched && items.length === 0 ? (
          <EmptyState
            title={t("search.noResults")}
            description="未找到相关内容，请尝试更换关键词或筛选类型。"
          />
        ) : null}
        {!loading && !error && items.length > 0 ? (
          <ul className="workspace-surface">
            {items.map((item) => (
              <li key={`${item.type}-${item.id}`} className="workspace-list-row p-0">
                <Link className="block p-4 sm:px-5 transition-colors hover:bg-[var(--surface-muted)]" href={resultHref(item)}>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge size="sm" variant={resultBadgeVariant(item.type)}>
                      {resultLabel(item.type, t)}
                    </Badge>
                    <span className="text-sm font-semibold text-[var(--ink)]">{item.title}</span>
                  </div>
                  {item.snippet && item.snippet !== item.title ? (
                    <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm leading-6 text-[var(--ink-muted)]">{item.snippet}</p>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </PageContainer>
  );
}

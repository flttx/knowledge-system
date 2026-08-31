"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/locale-provider";
import { SkeletonBacklinks } from "@/components/ui/skeleton";
import { useSwrQuery } from "@/lib/hooks/use-swr-query";

interface Backlink {
  noteId: string;
  title: string;
  relationType: "wikilink" | "manual";
  context: string;
}

interface BacklinkResponse {
  items: Backlink[];
}

export function BacklinksPanel({ noteId }: { noteId: string }) {
  const { t } = useI18n();
  const { data, loading, error } = useSwrQuery<BacklinkResponse>(`/api/notes/${noteId}/backlinks`);
  const items = data?.items ?? [];

  if (loading) {
    return <SkeletonBacklinks count={2} />;
  }

  return (
    <aside className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" aria-labelledby="backlinks-heading" aria-busy={loading}>
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[var(--accent-soft)] text-xs text-[var(--accent-strong)] font-serif font-bold">
            &larr;&rarr;
          </span>
          <h2 id="backlinks-heading" className="text-sm font-semibold font-serif text-[var(--ink)]">
            {t("backlinks.title")}
          </h2>
        </div>
        {!error ? (
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--ink-muted)]">
            {items.length} 篇关联
          </span>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
      {!error && items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[var(--line)] py-6 text-center text-xs text-[var(--ink-muted)]">
          {t("backlinks.empty")}
        </div>
      ) : null}
      {!error && items.length > 0 ? (
        <ul className="mt-3.5 space-y-2.5">
          {items.map((item) => (
            <li
              key={`${item.noteId}:${item.relationType}`}
              className="group rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/40 p-3.5 transition-all hover:border-[var(--accent)]/50 hover:bg-[var(--surface)] hover:shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/notes/${item.noteId}`}
                  className="text-xs sm:text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent-strong)] transition-colors flex items-center gap-1.5"
                >
                  <span>{item.title}</span>
                  <span className="text-[10px] text-[var(--ink-faint)] opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                </Link>
                <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono font-medium border border-[var(--line)] bg-[var(--surface)] text-[var(--ink-muted)] shrink-0">
                  {t(item.relationType === "wikilink" ? "graph.relation.wikilink" : "graph.relation.manual")}
                </span>
              </div>
              {item.context ? (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--ink-muted)] font-serif pl-2 border-l-2 border-[var(--line-strong)]">
                  {item.context}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { SkeletonBacklinks } from "@/components/ui/skeleton";

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
  const [items, setItems] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/notes/${noteId}/backlinks`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as BacklinkResponse | { error?: { message?: string } };
        if (!response.ok) throw new Error("error" in body ? body.error?.message : t("backlinks.error"));
        setError(null);
        setItems((body as BacklinkResponse).items);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : t("backlinks.error"));
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [noteId, t]);

  if (loading) {
    return <SkeletonBacklinks count={2} />;
  }

  return (
    <aside className="mt-8 border-t border-[var(--line-strong)] pt-5" aria-labelledby="backlinks-heading" aria-busy={loading}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="backlinks-heading" className="text-base font-semibold text-[var(--ink)]">{t("backlinks.title")}</h2>
        {!error ? <span className="text-xs text-[var(--ink-faint)]">{items.length}</span> : null}
      </div>
      {error ? <p className="mt-3 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
      {!error && items.length === 0 ? <p className="mt-3 text-xs text-[var(--ink-muted)]">{t("backlinks.empty")}</p> : null}
      {!error && items.length > 0 ? (
        <ul className="mt-3 space-y-2.5">
          {items.map((item) => (
            <li key={`${item.noteId}:${item.relationType}`} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 transition-colors hover:bg-[var(--surface-muted)]">
              <div className="flex items-center gap-2">
                <Link href={`/notes/${item.noteId}`} className="text-sm font-semibold text-[var(--accent-strong)] hover:underline">
                  {item.title}
                </Link>
                <span className="inline-flex items-center h-4 rounded px-1 text-[10px] font-medium bg-[var(--surface-muted)] text-[var(--ink-muted)]">
                  {t(item.relationType === "wikilink" ? "graph.relation.wikilink" : "graph.relation.manual")}
                </span>
              </div>
              {item.context ? (
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[var(--ink-muted)]">{item.context}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  );
}

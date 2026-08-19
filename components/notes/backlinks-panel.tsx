"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";

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

  return (
    <aside className="mt-8 border-y border-[var(--line)] py-4" aria-labelledby="backlinks-heading" aria-busy={loading}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="backlinks-heading" className="text-lg font-semibold text-[var(--ink)]">{t("backlinks.title")}</h2>
        {!loading && !error ? <span className="text-xs text-[var(--ink-faint)]">{items.length}</span> : null}
      </div>
      {loading ? <p className="mt-4 text-sm text-[var(--ink-muted)]">{t("backlinks.loading")}</p> : null}
      {error ? <p className="mt-4 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
      {!loading && !error && items.length === 0 ? <p className="mt-4 text-sm text-[var(--ink-muted)]">{t("backlinks.empty")}</p> : null}
{!loading && !error && items.length > 0 ? <ul className="mt-4 space-y-3">{items.map((item) => <li key={`${item.noteId}:${item.relationType}`} className="rounded-xl bg-[var(--surface-muted)] p-3"><Link href={`/notes/${item.noteId}`} className="font-medium text-[var(--accent-strong)] hover:underline">{item.title}</Link><span className="ml-2 text-xs text-[var(--ink-faint)]">{t(item.relationType === "wikilink" ? "graph.relation.wikilink" : "graph.relation.manual")}</span>{item.context ? <p className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--ink-muted)]">{item.context}</p> : null}</li>)}</ul> : null}
    </aside>
  );
}

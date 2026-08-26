"use client";

import { useEffect, useState } from "react";

import { GraphCanvas } from "@/components/graph/graph-canvas";
import type { GraphResult } from "@/lib/graph/types";
import { useI18n } from "@/components/i18n/locale-provider";

export function LocalGraph({ noteId }: { noteId: string }) {
  const { t } = useI18n();
  const [depth, setDepth] = useState<1 | 2>(1);
  const [graph, setGraph] = useState<GraphResult>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/graph/local/${noteId}?depth=${depth}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as GraphResult | { error?: { message?: string } };
        if (!response.ok) throw new Error("error" in body ? body.error?.message : "局部图谱加载失败。");
        setGraph(body as GraphResult);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : t("graph.error"));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [depth, noteId, t]);

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]" aria-labelledby="local-graph-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-[var(--accent-soft)] text-xs text-[var(--accent-strong)] font-bold">
            ✦
          </span>
          <div>
            <h2 id="local-graph-heading" className="text-sm font-semibold font-serif text-[var(--ink)]">
              {t("graph.local")}
            </h2>
            <p className="text-[11px] text-[var(--ink-muted)]">{t("graph.localDescription")}</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-[var(--line)] bg-[var(--surface-muted)] p-0.5" role="group" aria-label={t("graph.depth")}>
          <button
            type="button"
            className={`min-h-[26px] h-[26px] rounded-md px-2.5 text-[11px] font-medium transition-colors cursor-pointer ${depth === 1 ? "bg-[var(--surface)] text-[var(--accent-strong)] font-semibold shadow-2xs" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}
            aria-pressed={depth === 1}
            onClick={() => setDepth(1)}
          >
            {t("graph.level", { count: 1 })}
          </button>
          <button
            type="button"
            className={`min-h-[26px] h-[26px] rounded-md px-2.5 text-[11px] font-medium transition-colors cursor-pointer ${depth === 2 ? "bg-[var(--surface)] text-[var(--accent-strong)] font-semibold shadow-2xs" : "text-[var(--ink-muted)] hover:text-[var(--ink)]"}`}
            aria-pressed={depth === 2}
            onClick={() => setDepth(2)}
          >
            {t("graph.level", { count: 2 })}
          </button>
        </div>
      </div>
      <div className="mt-4" aria-busy={loading}>
        {error ? <p className="rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
        {loading ? <p className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-xs text-[var(--ink-muted)]" role="status">{t("graph.loading")}</p> : null}
        {!loading && !error ? <GraphCanvas graph={graph} currentNodeId={noteId} /> : null}
      </div>
    </section>
  );
}

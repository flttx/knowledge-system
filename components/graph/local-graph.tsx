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
    <section className="mt-8" aria-labelledby="local-graph-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 id="local-graph-heading" className="text-lg font-semibold text-[var(--ink)]">{t("graph.local")}</h2><p className="mt-1 text-sm text-[var(--ink-muted)]">{t("graph.localDescription")}</p></div>
        <div className="flex rounded-xl border border-[var(--line)] bg-white p-1" role="group" aria-label={t("graph.depth")}><button type="button" className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${depth === 1 ? "bg-[var(--ink)] text-white" : "text-[var(--ink-muted)]"}`} aria-pressed={depth === 1} onClick={() => setDepth(1)}>{t("graph.level", { count: 1 })}</button><button type="button" className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${depth === 2 ? "bg-[var(--ink)] text-white" : "text-[var(--ink-muted)]"}`} aria-pressed={depth === 2} onClick={() => setDepth(2)}>{t("graph.level", { count: 2 })}</button></div>
      </div>
      <div className="mt-4" aria-busy={loading}>
        {error ? <p className="rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
        {loading ? <p className="rounded-xl border border-[var(--line)] bg-white p-5 text-sm text-[var(--ink-muted)]" role="status">{t("graph.loading")}</p> : null}
        {!loading && !error ? <GraphCanvas graph={graph} currentNodeId={noteId} /> : null}
      </div>
    </section>
  );
}

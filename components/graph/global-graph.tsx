"use client";

import { useEffect, useState } from "react";

import { GraphCanvas } from "@/components/graph/graph-canvas";
import { useI18n } from "@/components/i18n/locale-provider";
import { requestJson } from "@/lib/api/client";
import { PageContainer, PageHeader } from "@/components/ui/workspace";
import {
  graphRelationTypes,
  type GraphRelationType,
  type GraphResult,
} from "@/lib/graph/types";

type GraphResponse = GraphResult;

async function requestGraph(url: string, signal: AbortSignal): Promise<GraphResponse> {
  return requestJson<GraphResponse>(url, { signal }, "图谱加载失败，请重试。");
}

function relationTypeLabel(
  type: GraphRelationType,
  t: (key: "graph.relation.wikilink" | "graph.relation.manual" | "graph.relation.aiSuggested" | "graph.relation.semantic") => string,
): string {
  const keys = {
    wikilink: "graph.relation.wikilink",
    manual: "graph.relation.manual",
    ai_suggested: "graph.relation.aiSuggested",
    semantic: "graph.relation.semantic",
  } as const;
  return t(keys[type]);
}

export function GlobalGraph() {
  const { t } = useI18n();
  const [tag, setTag] = useState("");
  const [relationType, setRelationType] = useState<GraphRelationType | "">("");
  const [includeSuggested, setIncludeSuggested] = useState(false);
  const [graph, setGraph] = useState<GraphResult>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams({ limit: "200" });
      if (tag.trim()) params.set("tag", tag.trim());
      if (relationType) params.set("relationType", relationType);
      if (includeSuggested) params.set("includeSuggested", "true");
      setLoading(true);
      requestGraph(`/api/graph/global?${params}`, controller.signal)
        .then((result) => { setGraph(result); setError(null); })
        .catch((loadError: unknown) => {
          if (loadError instanceof DOMException && loadError.name === "AbortError") return;
          setError(loadError instanceof Error ? loadError.message : t("graph.error"));
        })
        .finally(() => setLoading(false));
    }, 120);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [includeSuggested, relationType, t, tag]);

  return (
    <PageContainer width="canvas" ariaLabelledBy="global-graph-heading">
      <PageHeader className="items-start">
        <div>
          <p className="workspace-eyebrow">{t("graph.eyebrow")}</p>
          <h1 id="global-graph-heading" className="workspace-page-title">{t("layout.graphTitle")}</h1>
          <p className="workspace-page-description">{t("layout.graphDescription")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="sr-only" htmlFor="graph-tag-filter">{t("graph.tagFilter")}</label>
          <input id="graph-tag-filter" className="workspace-input w-36 sm:w-44" placeholder={t("graph.tagFilter")} value={tag} onChange={(event) => setTag(event.target.value)} />
          <label className="sr-only" htmlFor="graph-relation-filter">{t("graph.relationFilter")}</label>
          <select id="graph-relation-filter" className="workspace-input" value={relationType} onChange={(event) => setRelationType(event.target.value as GraphRelationType | "")}>
            <option value="">{t("graph.allRelations")}</option>
            {graphRelationTypes.map((type) => <option key={type} value={type}>{relationTypeLabel(type, t)}</option>)}
          </select>
          <label className="inline-flex min-h-[38px] h-[38px] items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-2.5 text-xs text-[var(--ink-muted)] cursor-pointer select-none">
            <input type="checkbox" checked={includeSuggested} onChange={(event) => setIncludeSuggested(event.target.checked)} className="accent-[var(--accent)]" />
            {t("graph.showSuggested")}
          </label>
        </div>
      </PageHeader>
      <div className="mt-6" aria-busy={loading}>
        {error ? <div className="rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">{error}</div> : null}
        {loading ? <div className="flex min-h-[22rem] items-center justify-center border-y border-[var(--line)] bg-[var(--surface)] text-sm text-[var(--ink-muted)]" role="status">{t("graph.loading")}</div> : null}
        {!loading && !error ? <GraphCanvas graph={graph} /> : null}
      </div>
    </PageContainer>
  );
}

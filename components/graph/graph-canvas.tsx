"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";

import { layoutGraph, type GraphPosition } from "@/lib/graph/layout";
import type { GraphNode, GraphResult } from "@/lib/graph/types";
import { useI18n } from "@/components/i18n/locale-provider";

const WIDTH = 1000;
const HEIGHT = 620;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface DragState {
  pointerId: number;
  x: number;
  y: number;
}

function nodeColor(node: GraphNode, currentNodeId?: string): string {
  return node.id === currentNodeId ? "var(--accent-strong)" : "var(--ink-soft)";
}

export function GraphCanvas({
  graph,
  currentNodeId,
}: {
  graph: GraphResult;
  currentNodeId?: string;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(currentNodeId ?? null);
  const dragRef = useRef<DragState | null>(null);
  const positions = useMemo(
    () => layoutGraph(graph.nodes, graph.edges, WIDTH, HEIGHT),
    [graph.edges, graph.nodes],
  );
  const positionsById = useMemo(
    () => new Map<string, GraphPosition>(positions.map((position) => [position.id, position])),
    [positions],
  );
  const previewNode = graph.nodes.find((node) => node.id === previewNodeId);

  if (graph.nodes.length < 2 || graph.edges.length === 0) {
    return (
      <div className="flex min-h-[22rem] items-center justify-center border-y border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)] p-8 text-center">
        <div>
          <p className="font-semibold text-[var(--ink)]">{t("graph.empty")}</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--ink-muted)]">{t("graph.emptyDescription")}</p>
        </div>
      </div>
    );
  }

  function handlePointerDown(event: ReactPointerEvent<SVGSVGElement>): void {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  }

  function handlePointerMove(event: ReactPointerEvent<SVGSVGElement>): void {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    dragRef.current = { ...drag, x: event.clientX, y: event.clientY };
    setViewport((current) => ({ ...current, x: current.x + deltaX, y: current.y + deltaY }));
  }

  function handlePointerUp(event: ReactPointerEvent<SVGSVGElement>): void {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  function changeZoom(delta: number): void {
    setViewport((current) => ({ ...current, scale: Math.min(2.4, Math.max(0.6, current.scale + delta)) }));
  }

  function openNode(nodeId: string): void {
    router.push(`/notes/${nodeId}`);
  }

  return (
    <div className="overflow-hidden border-y border-[var(--line-strong)] bg-[var(--surface)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
        <p className="text-xs text-[var(--ink-muted)]">{t("graph.instructions")}</p>
        <div className="flex items-center gap-1">
          <button type="button" aria-label={t("graph.zoomOut")} className="min-h-9 min-w-9 rounded-lg border border-[var(--line)] text-lg text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]" onClick={() => changeZoom(-0.2)}>−</button>
          <button type="button" aria-label={t("graph.resetZoom")} className="min-h-9 rounded-lg px-2 text-xs text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]" onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}>{Math.round(viewport.scale * 100)}%</button>
          <button type="button" aria-label={t("graph.zoomIn")} className="min-h-9 min-w-9 rounded-lg border border-[var(--line)] text-lg text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]" onClick={() => changeZoom(0.2)}>+</button>
        </div>
      </div>
      <svg
        aria-label={t("graph.ariaLabel")}
        className="block h-[min(68vh,720px)] min-h-[22rem] w-full touch-none select-none bg-[var(--surface-muted)]"
        role="img"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={(event) => { event.preventDefault(); changeZoom(event.deltaY > 0 ? -0.1 : 0.1); }}
      >
        <title>{t("graph.ariaLabel")}</title>
        <defs>
          <marker id="graph-arrow" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="7" refY="4" viewBox="0 0 8 8">
            <path d="M0 0L8 4L0 8Z" fill="var(--line-strong)" />
          </marker>
        </defs>
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
          {graph.edges.map((edge) => {
            const source = positionsById.get(edge.source);
            const target = positionsById.get(edge.target);
            if (!source || !target) return null;
            return <line key={edge.id} markerEnd="url(#graph-arrow)" stroke="var(--line-strong)" strokeDasharray={edge.status === "suggested" ? "8 7" : undefined} strokeWidth="2" x1={source.x} x2={target.x} y1={source.y} y2={target.y} />;
          })}
          {graph.nodes.map((node) => {
            const position = positionsById.get(node.id);
            if (!position) return null;
            const isCurrent = node.id === currentNodeId;
            return <g key={node.id} aria-label={`${t("nav.notes")}: ${node.title}`} className="cursor-pointer outline-none" role="button" tabIndex={0} onClick={() => openNode(node.id)} onFocus={() => setPreviewNodeId(node.id)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openNode(node.id); } }} onMouseEnter={() => setPreviewNodeId(node.id)} onPointerDown={(event) => { event.stopPropagation(); setPreviewNodeId(node.id); }}>
              <circle cx={position.x} cy={position.y} fill={isCurrent ? "var(--accent-soft)" : "var(--surface)"} r={isCurrent ? 30 : 25} stroke={nodeColor(node, currentNodeId)} strokeWidth={isCurrent ? 4 : 2} />
              <text dominantBaseline="middle" fill="var(--ink)" fontSize="14" textAnchor="middle" x={position.x} y={position.y}>
                {node.title.length > 12 ? `${node.title.slice(0, 12)}…` : node.title}
              </text>
            </g>;
          })}
        </g>
      </svg>
      {previewNode ? <div className="border-t border-[var(--line)] px-4 py-3" aria-live="polite"><p className="text-sm font-semibold text-[var(--ink)]">{previewNode.title}</p>{previewNode.tags.length > 0 ? <p className="mt-1 text-xs text-[var(--ink-muted)]">{previewNode.tags.join(" · ")}</p> : null}</div> : null}
    </div>
  );
}

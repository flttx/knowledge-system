"use client";

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useRouter } from "next/navigation";

import { layoutGraph, getTagColor, type GraphPosition } from "@/lib/graph/layout";
import type { GraphResult } from "@/lib/graph/types";
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
  const [hideOrphans, setHideOrphans] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  // Connected node IDs calculation
  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const edge of graph.edges) {
      ids.add(edge.source);
      ids.add(edge.target);
    }
    return ids;
  }, [graph.edges]);

  // Filtered nodes
  const displayNodes = useMemo(() => {
    if (!hideOrphans) return graph.nodes;
    return graph.nodes.filter((node) => connectedNodeIds.has(node.id) || node.id === currentNodeId);
  }, [connectedNodeIds, currentNodeId, graph.nodes, hideOrphans]);

  const positions = useMemo(
    () => layoutGraph(displayNodes, graph.edges, WIDTH, HEIGHT),
    [displayNodes, graph.edges],
  );
  const positionsById = useMemo(
    () => new Map<string, GraphPosition>(positions.map((position) => [position.id, position])),
    [positions],
  );
  const previewNode = displayNodes.find((node) => node.id === previewNodeId);

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
    <div
      className={`relative overflow-hidden border border-[var(--line-strong)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all ${
        isFullscreen
          ? "fixed inset-0 z-50 rounded-none h-dvh w-dvw"
          : "rounded-2xl"
      }`}
    >
      {/* Floating Header Instructions & Controls */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-center justify-between gap-2 p-4">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink-muted)] backdrop-blur-md shadow-sm">
          <span>{t("graph.instructions")}</span>
          <span className="h-3 w-px bg-[var(--line)]" />
          <span>{t("graph.stats", { nodes: displayNodes.length, edges: graph.edges.length })}</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 backdrop-blur-md shadow-sm">
          {/* Hide Orphans Toggle */}
          <button
            type="button"
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              hideOrphans
                ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            }`}
            onClick={() => setHideOrphans((v) => !v)}
            title={t(hideOrphans ? "graph.showAll" : "graph.hideOrphans")}
          >
            {t(hideOrphans ? "graph.showAll" : "graph.hideOrphans")}
          </button>

          <span className="h-3 w-px bg-[var(--line)]" />

          {/* Zoom controls */}
          <button
            type="button"
            aria-label={t("graph.zoomOut")}
            className="flex size-7 items-center justify-center rounded-full text-sm font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
            onClick={() => changeZoom(-0.2)}
          >
            &#8722;
          </button>
          <button
            type="button"
            aria-label={t("graph.resetZoom")}
            className="h-7 rounded-full px-2 text-[11px] font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
            onClick={() => setViewport({ x: 0, y: 0, scale: 1 })}
          >
            {Math.round(viewport.scale * 100)}%
          </button>
          <button
            type="button"
            aria-label={t("graph.zoomIn")}
            className="flex size-7 items-center justify-center rounded-full text-sm font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
            onClick={() => changeZoom(0.2)}
          >
            +
          </button>

          <span className="h-3 w-px bg-[var(--line)]" />

          {/* Fullscreen toggle */}
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-full text-xs font-semibold text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
            onClick={() => setIsFullscreen((v) => !v)}
            title={t(isFullscreen ? "graph.exitFullscreen" : "graph.enterFullscreen")}
          >
            {isFullscreen ? "↙" : "↗"}
          </button>
        </div>
      </div>

      <svg
        aria-label={t("graph.ariaLabel")}
        className="block h-[min(72vh,760px)] min-h-[26rem] w-full touch-none select-none bg-[var(--background)]"
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
            return <line key={edge.id} markerEnd="url(#graph-arrow)" stroke="var(--line-strong)" strokeDasharray={edge.status === "suggested" ? "8 7" : undefined} strokeWidth="1.5" x1={source.x} x2={target.x} y1={source.y} y2={target.y} />;
          })}
          {graph.nodes.map((node) => {
            const position = positionsById.get(node.id);
            if (!position) return null;
            const isCurrent = node.id === currentNodeId;
            const isPreview = node.id === previewNodeId;
            const radius = isCurrent ? 12 : isPreview ? 10 : 8;
            return (
              <g
                key={node.id}
                aria-label={`${t("nav.notes")}: ${node.title}`}
                className="group cursor-pointer outline-none"
                role="button"
                tabIndex={0}
                onClick={() => openNode(node.id)}
                onFocus={() => setPreviewNodeId(node.id)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openNode(node.id); } }}
                onMouseEnter={() => setPreviewNodeId(node.id)}
                onPointerDown={(event) => { event.stopPropagation(); setPreviewNodeId(node.id); }}
              >
                {/* Node halo on active/hover */}
                {(isCurrent || isPreview) && (
                  <circle
                    cx={position.x}
                    cy={position.y}
                    fill={isCurrent ? "var(--accent-soft)" : "var(--surface-muted)"}
                    opacity={0.9}
                    r={radius + 6}
                  />
                )}
                {/* Node core circle with dynamic tag color */}
                <circle
                  cx={position.x}
                  cy={position.y}
                  fill={isCurrent ? "var(--accent-strong)" : isPreview ? "var(--accent)" : getTagColor(node.tags[0])}
                  r={radius}
                  stroke="var(--surface)"
                  strokeWidth={2}
                />
                {/* Node title label placed cleanly below the node */}
                <text
                  className="pointer-events-none select-none transition-all"
                  dominantBaseline="hanging"
                  fill={isCurrent ? "var(--accent-strong)" : isPreview ? "var(--ink)" : "var(--ink-soft)"}
                  fontSize={isCurrent ? "12" : "11"}
                  fontWeight={isCurrent ? "600" : isPreview ? "550" : "500"}
                  textAnchor="middle"
                  x={position.x}
                  y={position.y + radius + 7}
                >
                  {node.title.length > 12 ? `${node.title.slice(0, 12)}…` : node.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {previewNode ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
          <div
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] px-4 py-2 backdrop-blur-md shadow-xl transition-all hover:scale-[1.02] cursor-pointer"
            onClick={() => openNode(previewNode.id)}
            aria-live="polite"
          >
            <div>
              <p className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                <span>{previewNode.title}</span>
                <span className="text-[10px] text-[var(--ink-faint)] font-normal">&rarr; {t("graph.openNote")}</span>
              </p>
              {previewNode.tags.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {previewNode.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded px-1.5 py-0.2 text-[10px] font-medium"
                      style={{ backgroundColor: `${getTagColor(tag)}20`, color: getTagColor(tag) }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

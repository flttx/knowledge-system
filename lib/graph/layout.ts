import type { GraphEdge, GraphNode } from "@/lib/graph/types";

export interface GraphPosition {
  id: string;
  x: number;
  y: number;
}

const TAG_PALETTE = [
  "#a8433f", // 朱砂 (Cinnabar)
  "#3b5998", // 霁蓝 / 花青 (Mineral Blue)
  "#2d6a4f", // 黛绿 / 竹青 (Bamboo Green)
  "#a0522d", // 赭石 (Ochre)
  "#c68b24", // 藤黄 (Rattan Yellow)
  "#6d3b5b", // 紫檀 (Sandalwood Violet)
  "#4a5568", // 苍烟 (Smoke Grey)
  "#5c6d91", // 墨青 (Ink Teal)
];

export function getTagColor(tag?: string): string {
  if (!tag) return "var(--ink-soft)";
  let hash = 0;
  for (let i = 0; i < tag.length; i += 1) {
    hash = (hash << 5) - hash + tag.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TAG_PALETTE.length;
  return TAG_PALETTE[index];
}

export function layoutGraph(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width = 1000,
  height = 620,
): GraphPosition[] {
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return [{ id: nodes[0].id, x: width / 2, y: height / 2 }];

  const positions = nodes.map((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2;
    return {
      id: node.id,
      x: width / 2 + Math.cos(angle) * Math.min(width, height) * 0.35,
      y: height / 2 + Math.sin(angle) * Math.min(width, height) * 0.35,
      vx: 0,
      vy: 0,
    };
  });
  const byId = new Map(positions.map((position) => [position.id, position]));

  for (let iteration = 0; iteration < 85; iteration += 1) {
    for (const position of positions) {
      let forceX = 0;
      let forceY = 0;
      for (const other of positions) {
        if (position === other) continue;
        const dx = position.x - other.x;
        const dy = position.y - other.y;
        const distanceSquared = Math.max(dx * dx + dy * dy, 1800);
        const distance = Math.sqrt(distanceSquared);
        const repulsion = 6400 / distanceSquared;
        forceX += (dx / distance) * repulsion;
        forceY += (dy / distance) * repulsion;
      }

      for (const edge of edges) {
        if (edge.source !== position.id && edge.target !== position.id) continue;
        const otherId = edge.source === position.id ? edge.target : edge.source;
        const other = byId.get(otherId);
        if (!other) continue;
        const dx = other.x - position.x;
        const dy = other.y - position.y;
        const distance = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const attraction = (distance - 150) * 0.003;
        forceX += (dx / distance) * attraction;
        forceY += (dy / distance) * attraction;
      }

      forceX += (width / 2 - position.x) * 0.0009;
      forceY += (height / 2 - position.y) * 0.0009;
      position.vx = (position.vx + forceX) * 0.85;
      position.vy = (position.vy + forceY) * 0.85;
    }

    for (const position of positions) {
      position.x = Math.min(width - 60, Math.max(60, position.x + position.vx));
      position.y = Math.min(height - 50, Math.max(50, position.y + position.vy));
    }
  }

  return positions.map(({ id, x, y }) => ({ id, x, y }));
}

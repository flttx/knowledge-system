import type { GraphEdge, GraphNode } from "@/lib/graph/types";

export interface GraphPosition {
  id: string;
  x: number;
  y: number;
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
      x: width / 2 + Math.cos(angle) * Math.min(width, height) * 0.3,
      y: height / 2 + Math.sin(angle) * Math.min(width, height) * 0.3,
      vx: 0,
      vy: 0,
    };
  });
  const byId = new Map(positions.map((position) => [position.id, position]));

  for (let iteration = 0; iteration < 70; iteration += 1) {
    for (const position of positions) {
      let forceX = 0;
      let forceY = 0;
      for (const other of positions) {
        if (position === other) continue;
        const dx = position.x - other.x;
        const dy = position.y - other.y;
        const distanceSquared = Math.max(dx * dx + dy * dy, 1600);
        const distance = Math.sqrt(distanceSquared);
        const repulsion = 5200 / distanceSquared;
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
        const attraction = (distance - 170) * 0.0025;
        forceX += (dx / distance) * attraction;
        forceY += (dy / distance) * attraction;
      }

      forceX += (width / 2 - position.x) * 0.0008;
      forceY += (height / 2 - position.y) * 0.0008;
      position.vx = (position.vx + forceX) * 0.84;
      position.vy = (position.vy + forceY) * 0.84;
    }

    for (const position of positions) {
      position.x = Math.min(width - 55, Math.max(55, position.x + position.vx));
      position.y = Math.min(height - 45, Math.max(45, position.y + position.vy));
    }
  }

  return positions.map(({ id, x, y }) => ({ id, x, y }));
}

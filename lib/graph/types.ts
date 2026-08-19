export const graphRelationTypes = [
  "wikilink",
  "manual",
  "ai_suggested",
  "semantic",
] as const;

export type GraphRelationType = (typeof graphRelationTypes)[number];
export type GraphRelationStatus = "confirmed" | "suggested";

export interface GraphNode {
  id: string;
  title: string;
  tags: string[];
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: GraphRelationType;
  status: GraphRelationStatus;
}

export interface GraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface LocalGraphOptions {
  depth?: number;
  includeSuggested?: boolean;
}

export interface GlobalGraphOptions {
  tag?: string;
  relationType?: GraphRelationType;
  includeSuggested?: boolean;
  limit?: number;
}

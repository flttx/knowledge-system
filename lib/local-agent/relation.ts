export const localRelationTypes = ["semantic", "ai_suggested"] as const;

export type LocalRelationType = (typeof localRelationTypes)[number];

export function canonicalRelationEndpoints(
  relationType: LocalRelationType,
  sourceNoteId: string,
  targetNoteId: string,
): { sourceNoteId: string; targetNoteId: string } {
  if (relationType !== "semantic" || sourceNoteId <= targetNoteId) {
    return { sourceNoteId, targetNoteId };
  }
  return { sourceNoteId: targetNoteId, targetNoteId: sourceNoteId };
}

export function relationPairKey(
  relationType: LocalRelationType,
  sourceNoteId: string,
  targetNoteId: string,
): string {
  const endpoints = canonicalRelationEndpoints(
    relationType,
    sourceNoteId,
    targetNoteId,
  );
  return `${relationType}:${endpoints.sourceNoteId}:${endpoints.targetNoteId}`;
}

export function relationOriginKey(
  relationType: LocalRelationType,
  sourceNoteId: string,
  targetNoteId: string,
): string {
  return `codex:${relationPairKey(relationType, sourceNoteId, targetNoteId)}`;
}

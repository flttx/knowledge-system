export interface NoteDraft {
  title: string;
  contentMarkdown: string;
  tagNames: string[];
  savedAt: string;
}

export function noteDraftKey(noteId: string): string {
  return `knowledge-system:note-draft:${noteId}`;
}

export function serializeNoteDraft(draft: NoteDraft): string {
  return JSON.stringify(draft);
}

export function parseNoteDraft(value: string | null): NoteDraft | null {
  if (!value) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (!isNoteDraft(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isDraftNewerThan(
  draft: NoteDraft,
  serverUpdatedAt: string,
): boolean {
  return new Date(draft.savedAt).getTime() > new Date(serverUpdatedAt).getTime();
}

function isNoteDraft(value: unknown): value is NoteDraft {
  if (!value || typeof value !== "object") {
    return false;
  }

  const draft = value as Record<string, unknown>;
  return (
    typeof draft.title === "string" &&
    typeof draft.contentMarkdown === "string" &&
    Array.isArray(draft.tagNames) &&
    draft.tagNames.every((tagName) => typeof tagName === "string") &&
    typeof draft.savedAt === "string" &&
    !Number.isNaN(new Date(draft.savedAt).getTime())
  );
}

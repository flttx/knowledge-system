export interface LastEditedNoteInfo {
  id: string;
  title: string;
  updatedAt: string;
}

const LAST_NOTE_STORAGE_KEY = "knowledge:last_edited_note";

export function recordLastEditedNote(id: string, title: string): void {
  if (typeof window === "undefined" || !id) return;
  try {
    const payload: LastEditedNoteInfo = {
      id,
      title: title.trim() || "未命名笔记",
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(LAST_NOTE_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("knowledge:last-note-updated", { detail: payload }));
  } catch {
    // Ignore storage quota errors
  }
}

export function getLastEditedNote(): LastEditedNoteInfo | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_NOTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastEditedNoteInfo;
    if (parsed && typeof parsed.id === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

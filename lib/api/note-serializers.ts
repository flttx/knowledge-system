import type { NoteDetail, NoteSummary } from "@/lib/services/note-service";

export function serializeNoteSummary(note: NoteSummary) {
  return {
    ...note,
    tags: note.tags.map((tag) => tag.name),
  };
}

export function serializeNote(note: NoteDetail) {
  return {
    ...note,
    tags: note.tags.map((tag) => tag.name),
  };
}

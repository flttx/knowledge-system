import type { LocalSuggestion } from "@/lib/local-agent/suggestions";
export interface HighlightData {
  id: string;
  sourceId: string | null;
  sourceTitle: string | null;
  noteId: string | null;
  noteTitle: string | null;
  text: string;
  page: number | null;
  location: string | null;
  personalComment: string | null;
  status: string;
  createdAt: string;
}

export interface QuickNoteData {
  id: string;
  sourceId: string | null;
  sourceTitle: string | null;
  noteId: string | null;
  noteTitle: string | null;
  content: string;
  status: string;
  createdAt: string;
}

export interface ScreenshotData {
  id: string;
  attachmentId: string;
  imageUrl: string;
  fileName: string;
  mimeType: string;
  sourceId: string | null;
  sourceTitle: string | null;
  noteId: string | null;
  noteTitle: string | null;
  page: string | null;
  location: string | null;
  annotation: string | null;
  status: string;
  createdAt: string;
}

export interface SourceOption {
  id: string;
  title: string;
}

export interface NoteOption {
  id: string;
  title: string;
}

export type InboxView = "inbox" | "processed" | "archived";

export interface InboxHighlight {
  type: "highlight";
  id: string;
  data: HighlightData;
}

export interface InboxQuickNote {
  type: "quick_note";
  id: string;
  data: QuickNoteData;
}

export interface InboxScreenshot {
  type: "screenshot";
  id: string;
  data: ScreenshotData;
}

export interface SuggestionData {
  id: string;
  type: LocalSuggestion["type"];
  payload: LocalSuggestion;
  status: string;
  createdAt: string;
  reviewedAt: string | null;
  sourceReferenceCount: number;
  relation?: {
    sourceNoteId: string;
    targetNoteId: string;
    sourceTitle: string | null;
    targetTitle: string | null;
    relationType: "semantic" | "ai_suggested";
    reason: string;
    confidence: number;
  };
}

export interface InboxSuggestion {
  type: "ai_suggestion";
  id: string;
  data: SuggestionData;
}

export type InboxItem = InboxHighlight | InboxQuickNote | InboxScreenshot | InboxSuggestion;


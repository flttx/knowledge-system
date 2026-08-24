import {
  listHighlights,
  type HighlightItem,
} from "@/lib/services/highlight-service";
import {
  listQuickNotes,
  type QuickNoteItem,
} from "@/lib/services/quick-note-service";
import {
  listScreenshots,
  type ScreenshotItem,
} from "@/lib/services/screenshot-service";
import { getLimit } from "@/lib/services/pagination";
import {
  listPendingSuggestions,
  type SuggestionSummary,
} from "@/lib/services/suggestion-service";

export interface InboxHighlightItem {
  type: "highlight";
  id: string;
  createdAt: Date;
  data: HighlightItem;
}

export interface InboxQuickNoteItem {
  type: "quick_note";
  id: string;
  createdAt: Date;
  data: QuickNoteItem;
}

export interface InboxSuggestionItem {
  type: "ai_suggestion";
  id: string;
  createdAt: Date;
  data: SuggestionSummary;
}

export interface InboxScreenshotItem {
  type: "screenshot";
  id: string;
  createdAt: Date;
  data: ScreenshotItem;
}

export type InboxItem = InboxHighlightItem | InboxQuickNoteItem | InboxScreenshotItem | InboxSuggestionItem;

export interface InboxPage {
  items: InboxItem[];
  nextCursor: null;
}

export async function listInbox(
  userId: string,
  limitInput?: number,
): Promise<InboxPage> {
  const limit = getLimit(limitInput);
  const [highlights, quickNotes, screenshots, suggestions] = await Promise.all([
    listHighlights(userId, { status: "inbox", limit }),
    listQuickNotes(userId, { status: "inbox", limit }),
    listScreenshots(userId, { status: "inbox", limit }),
    listPendingSuggestions(userId, limit),
  ]);
  const items: InboxItem[] = [
    ...highlights.items.map((data) => ({
      type: "highlight" as const,
      id: data.id,
      createdAt: data.createdAt,
      data,
    })),
    ...quickNotes.items.map((data) => ({
      type: "quick_note" as const,
      id: data.id,
      createdAt: data.createdAt,
      data,
    })),
    ...screenshots.items.map((data) => ({
      type: "screenshot" as const,
      id: data.id,
      createdAt: data.createdAt,
      data,
    })),
    ...suggestions.map((data) => ({
      type: "ai_suggestion" as const,
      id: data.id,
      createdAt: data.createdAt,
      data,
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, limit);

  return { items, nextCursor: null };
}

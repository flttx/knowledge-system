import { compareInbox, decodeInboxCursor, encodeInboxCursor } from "./inbox-pagination";
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
import type { InboxStatus } from "@/lib/services/validation";

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
  nextCursor: string | null;
}

export async function listInbox(
  userId: string,
  limitInput?: number,
  status: InboxStatus = "inbox",
  cursor?: string,
): Promise<InboxPage> {
  const limit = getLimit(limitInput);
  const inboxBoundary = decodeInboxCursor(cursor);
  const [highlights, quickNotes, screenshots, suggestions] = await Promise.all([
    listHighlights(userId, { status, limit, inboxBoundary }),
    listQuickNotes(userId, { status, limit, inboxBoundary }),
    listScreenshots(userId, { status, limit, inboxBoundary }),
    status === "inbox" ? listPendingSuggestions(userId, limit + 1, { boundary: inboxBoundary }) : Promise.resolve([] as SuggestionSummary[]),
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
    .sort(compareInbox);

  const page = items.slice(0, limit);
  const last = page.at(-1);
  const hasNext = items.length > limit || highlights.nextCursor || quickNotes.nextCursor || screenshots.nextCursor;
  return { items: page, nextCursor: hasNext && last ? encodeInboxCursor(last) : null };
}

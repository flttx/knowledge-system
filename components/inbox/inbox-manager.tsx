"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CloseIcon, ImageIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";
import { animateSuggestionCollapse } from "@/lib/motion/anime";
import type { LocalSuggestion } from "@/lib/local-agent/suggestions";

interface HighlightData {
  id: string;
  sourceId: string | null;
  sourceTitle: string | null;
  text: string;
  page: number | null;
  location: string | null;
  personalComment: string | null;
  status: string;
  createdAt: string;
}

interface QuickNoteData {
  id: string;
  sourceId: string | null;
  sourceTitle: string | null;
  content: string;
  status: string;
  createdAt: string;
}

interface ScreenshotData {
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

interface SourceOption {
  id: string;
  title: string;
}

interface ScreenshotNoteOption {
  id: string;
  title: string;
}

interface InboxHighlight {
  type: "highlight";
  id: string;
  data: HighlightData;
}

interface InboxQuickNote {
  type: "quick_note";
  id: string;
  data: QuickNoteData;
}

interface InboxScreenshot {
  type: "screenshot";
  id: string;
  data: ScreenshotData;
}

interface SuggestionData {
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

interface InboxSuggestion {
  type: "ai_suggestion";
  id: string;
  data: SuggestionData;
}

export type InboxItem = InboxHighlight | InboxQuickNote | InboxScreenshot | InboxSuggestion;

interface ApiErrorPayload {
  error?: { message?: string };
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? "Request failed. Please try again.");
  }
  return body as T;
}

export function HighlightRow({ item, onChanged }: { item: HighlightData; onChanged: () => void }) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLLIElement>(null);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [comment, setComment] = useState(item.personalComment ?? "");
  const [sourceId, setSourceId] = useState(item.sourceId ?? "");
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    void requestJson<{ items: SourceOption[] }>("/api/sources?limit=100")
      .then((result) => setSourceOptions(result.items))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Source loading failed.");
      });
  }, [editing]);

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/highlights/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, personalComment: comment || null, sourceId: sourceId || null }) });
      setEditing(false);
      onChanged();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Highlight save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    setError(null);
    try {
      await requestJson(`/api/highlights/${item.id}`, { method: "DELETE" });
      animateSuggestionCollapse(rowRef.current, () => {
        onChanged();
      });
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : "Highlight archive failed.");
    }
  }

  return (
    <li ref={rowRef} className="workspace-list-row p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all hover:border-[var(--line-strong)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="accent" size="sm" className="font-mono text-[10px] px-2 py-0.5">
            {t("capture.highlight")}
          </Badge>
          <span className="text-[11px] font-mono text-[var(--ink-faint)]">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}
          </span>
        </div>
        <span className="text-xs text-[var(--ink-muted)] truncate max-w-xs font-mono font-medium">
          {item.sourceTitle ?? t("common.unlinked")}
        </span>
      </div>
      {editing ? (
        <div className="mt-4 space-y-3">
          <textarea
            required
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="workspace-textarea min-h-24 font-serif text-sm sm:text-base leading-relaxed"
            inputMode="text"
          />
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder={t("inbox.commentPlaceholder")}
            className="workspace-textarea min-h-16 text-xs"
            inputMode="text"
          />
          <select aria-label={t("capture.source")} className="workspace-input" onChange={(event) => setSourceId(event.target.value)} value={sourceId}>
            <option value="">{t("common.unlinked")}</option>
            {sourceOptions.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
          </select>
          <div className="flex gap-2 pt-1">
            <Button size="sm" disabled={saving} aria-busy={saving} onClick={() => void save()}>
              {saving ? t("inbox.saving") : t("inbox.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("inbox.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-3 flex gap-3.5">
            <div className="w-1 rounded-full bg-[var(--accent)]/50 shrink-0" />
            <div className="flex-1">
              <p className="whitespace-pre-wrap font-serif text-sm sm:text-[15px] leading-relaxed text-[var(--ink)] font-normal selection:bg-[var(--accent-soft)]">
                {item.text}
              </p>
              {item.personalComment ? (
                <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/60 px-3.5 py-2.5 text-xs sm:text-sm text-[var(--ink-muted)] italic leading-relaxed">
                  <span className="not-italic text-[10px] font-mono text-[var(--ink-faint)] mr-1.5 font-semibold">✦ 批注：</span>
                  {item.personalComment}
                </div>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
            <span className="rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-mono text-[var(--ink-muted)]">
              {item.page ? t("common.page", { page: item.page }) : t("inbox.noPage")}
            </span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>{t("inbox.edit")}</Button>
              <Button size="sm" variant="secondary" onClick={() => void archive()}>{t("inbox.archive")}</Button>
            </div>
          </div>
        </>
      )}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
    </li>
  );
}

export function QuickNoteRow({ item, onChanged }: { item: QuickNoteData | SuggestionData; onChanged: () => void }) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLLIElement>(null);
  const isSuggestion = "payload" in item;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(isSuggestion ? "" : item.content);
  const [sourceId, setSourceId] = useState(isSuggestion ? "" : item.sourceId ?? "");
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) return;
    void requestJson<{ items: SourceOption[] }>("/api/sources?limit=100")
      .then((result) => setSourceOptions(result.items))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : "Source loading failed.");
      });
  }, [editing]);

  if (isSuggestion) {
    return <SuggestionRow item={item} onChanged={onChanged} />;
  }

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/quick-notes/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ content, sourceId: sourceId || null }) });
      setEditing(false);
      onChanged();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "Highlight save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    setError(null);
    try {
      await requestJson(`/api/quick-notes/${item.id}`, { method: "DELETE" });
      animateSuggestionCollapse(rowRef.current, () => {
        onChanged();
      });
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : "Highlight archive failed.");
    }
  }

  return (
    <li ref={rowRef} className="workspace-list-row p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all hover:border-[var(--line-strong)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm" className="font-mono text-[10px] px-2 py-0.5">
            {t("capture.quickNote")}
          </Badge>
          <span className="text-[11px] font-mono text-[var(--ink-faint)]">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}
          </span>
        </div>
        <span className="text-xs text-[var(--ink-muted)] truncate max-w-xs font-mono font-medium">
          {item.sourceTitle ?? t("common.unlinked")}
        </span>
      </div>
      {editing ? (
        <div className="mt-4 space-y-3">
          <textarea
            required
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="workspace-textarea min-h-24 text-sm sm:text-[15px] leading-relaxed"
            inputMode="text"
          />
          <select aria-label={t("capture.source")} className="workspace-input" onChange={(event) => setSourceId(event.target.value)} value={sourceId}>
            <option value="">{t("common.unlinked")}</option>
            {sourceOptions.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
          </select>
          <div className="flex gap-2 pt-1">
            <Button size="sm" disabled={saving} aria-busy={saving} onClick={() => void save()}>
              {saving ? t("inbox.saving") : t("inbox.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t("inbox.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <p className="mt-3 whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed text-[var(--ink)] font-normal selection:bg-[var(--accent-soft)]">
            {item.content}
          </p>
          <div className="mt-4 flex items-center justify-between border-t border-[var(--line)] pt-3">
            <span className="text-[11px] font-mono text-[var(--ink-faint)]">
              {item.content.length} 字符
            </span>
            <div className="flex gap-1.5">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>{t("inbox.edit")}</Button>
              <Button size="sm" variant="secondary" onClick={() => void archive()}>{t("inbox.archive")}</Button>
            </div>
          </div>
        </>
      )}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
    </li>
  );
}

export function ScreenshotRow({ item, onChanged }: { item: ScreenshotData; onChanged: () => void }) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLLIElement>(null);
  const viewTriggerRef = useRef<HTMLButtonElement>(null);
  const viewCloseRef = useRef<HTMLButtonElement>(null);
  const [editing, setEditing] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [annotation, setAnnotation] = useState(item.annotation ?? "");
  const [page, setPage] = useState(item.page ?? "");
  const [location, setLocation] = useState(item.location ?? "");
  const [sourceId, setSourceId] = useState(item.sourceId ?? "");
  const [noteId, setNoteId] = useState(item.noteId ?? "");
  const [sourceOptions, setSourceOptions] = useState<SourceOption[]>([]);
  const [noteOptions, setNoteOptions] = useState<ScreenshotNoteOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewing) return;

    const previousActiveElement = viewTriggerRef.current ?? document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => viewCloseRef.current?.focus(), 0);

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        setViewing(false);
      } else if (event.key === "Tab") {
        event.preventDefault();
        viewCloseRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousActiveElement instanceof HTMLElement) previousActiveElement.focus();
    };
  }, [viewing]);

  useEffect(() => {
    if (!editing) return;
    void requestJson<{ items: SourceOption[] }>("/api/sources?limit=100")
      .then((sources) => setSourceOptions(sources.items))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : t("common.error"));
      });
    void requestJson<{ items: ScreenshotNoteOption[] }>("/api/notes?limit=100")
      .then((notes) => setNoteOptions(notes.items))
      .catch((loadError: unknown) => {
        setError(loadError instanceof Error ? loadError.message : t("common.error"));
      });
  }, [editing, t]);

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/screenshots/${item.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          annotation: annotation || null,
          page: page || null,
          location: location || null,
          sourceId: sourceId || null,
          noteId: noteId || null,
        }),
      });
      setEditing(false);
      onChanged();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    setError(null);
    try {
      await requestJson(`/api/screenshots/${item.id}`, { method: "DELETE" });
      animateSuggestionCollapse(rowRef.current, onChanged);
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : t("common.error"));
    }
  }

  return (
    <li ref={rowRef} className="workspace-list-row p-4 sm:p-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] transition-all hover:border-[var(--line-strong)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm" className="font-mono text-[10px] px-2 py-0.5">
            {t("inbox.screenshot")}
          </Badge>
          <span className="text-[11px] font-mono text-[var(--ink-faint)]">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}
          </span>
        </div>
        <span className="max-w-xs truncate text-xs text-[var(--ink-muted)] font-mono font-medium">
          {item.sourceTitle ?? t("common.unlinked")}
        </span>
      </div>
      <button
        ref={viewTriggerRef}
        aria-label={t("inbox.viewOriginal")}
        className="group relative mt-3 flex h-56 w-full items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-black/90 text-left shadow-[var(--shadow-subtle)] transition-all hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] cursor-pointer sm:h-72"
        onClick={() => setViewing(true)}
        type="button"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt={t("inbox.viewOriginal")} className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-[1.015]" src={item.imageUrl} />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/25 to-transparent px-3 pb-3 pt-8 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100">
          <span className="text-xs font-medium tracking-wide">{t("inbox.viewOriginal")}</span>
          <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-xs">
            <ImageIcon size={15} />
          </span>
        </div>
      </button>
      {item.page || item.location ? (
        <p className="mt-2.5 text-xs font-mono text-[var(--ink-muted)]">
          {[item.page ? `p. ${item.page}` : null, item.location].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {item.annotation ? (
        <p className="mt-2.5 whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed text-[var(--ink)] font-normal">
          {item.annotation}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap justify-end gap-1.5 border-t border-[var(--line)] pt-3">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>{t("inbox.edit")}</Button>
        <Button size="sm" variant="secondary" onClick={() => void archive()}>{t("inbox.archive")}</Button>
      </div>
      {editing ? (
        <div className="mt-4 space-y-3">
          <textarea aria-label={t("capture.annotation")} className="workspace-textarea min-h-20" inputMode="text" onChange={(event) => setAnnotation(event.target.value)} value={annotation} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input aria-label={t("capture.page")} className="workspace-input" onChange={(event) => setPage(event.target.value)} placeholder={t("capture.page")} value={page} />
            <input aria-label={t("capture.location")} className="workspace-input" onChange={(event) => setLocation(event.target.value)} placeholder={t("capture.location")} value={location} />
          </div>
          <select aria-label={t("capture.source")} className="workspace-input" onChange={(event) => setSourceId(event.target.value)} value={sourceId}>
            <option value="">{t("common.unlinked")}</option>
            {sourceOptions.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
          </select>
          <select aria-label={t("inbox.note")} className="workspace-input" onChange={(event) => setNoteId(event.target.value)} value={noteId}>
            <option value="">{t("inbox.note")}</option>
            {noteOptions.map((note) => <option key={note.id} value={note.id}>{note.title}</option>)}
          </select>
          <div className="flex gap-2 pt-1">
            <Button size="sm" disabled={saving} aria-busy={saving} onClick={() => void save()}>{saving ? t("inbox.saving") : t("inbox.save")}</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>{t("inbox.cancel")}</Button>
          </div>
        </div>
      ) : null}
      {viewing && typeof document !== "undefined" ? createPortal(
        <div
          aria-labelledby={`screenshot-preview-title-${item.id}`}
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 animate-in fade-in duration-200"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewing(false);
          }}
          role="dialog"
        >
          <div
            className="relative flex h-[100dvh] w-full items-center justify-center overflow-auto bg-black"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setViewing(false);
            }}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between bg-gradient-to-b from-black/85 via-black/45 to-transparent px-4 pb-12 pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6 sm:pt-5">
              <div className="pointer-events-auto flex min-w-0 items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white">
                  <ImageIcon size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/55">{t("inbox.screenshot")}</p>
                  <h2 id={`screenshot-preview-title-${item.id}`} className="truncate text-sm font-semibold text-white sm:text-[15px]" title={item.fileName}>
                    {item.fileName}
                  </h2>
                  <p className="truncate text-xs text-white/60">
                    {[item.sourceTitle ?? t("common.unlinked"), item.page ? `p. ${item.page}` : null, item.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>
              <button
                ref={viewCloseRef}
                aria-label={t("common.close")}
                className="pointer-events-auto flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-colors hover:border-white/35 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                onClick={() => setViewing(false)}
                type="button"
              >
                <CloseIcon size={17} />
              </button>
            </div>
            <div className="flex h-full w-full items-center justify-center p-2 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] sm:p-6 sm:pt-24">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={t("inbox.viewOriginal")} className="max-h-full max-w-full object-contain shadow-[0_12px_32px_rgba(0,0,0,0.22)]" src={item.imageUrl} />
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
      {error ? <p className="mt-2 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
    </li>
  );
}

export function SuggestionRow({ item, onChanged }: { item: SuggestionData; onChanged: () => void }) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLLIElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const payload = item.payload;
  const [title, setTitle] = useState(
    payload.type === "relation" ? "Possible relation" : payload.proposedTitle,
  );
  const [bodyMarkdown, setBodyMarkdown] = useState(
    payload.type === "durable_note" ? payload.bodyMarkdown : "",
  );
  const [tagText, setTagText] = useState(
    payload.type === "durable_note" ? payload.suggestedTags.join(", ") : "",
  );

  async function review(action: "ignore" | "reject" | "accept"): Promise<void> {
    setBusy(true);
    setError(null);
    try {
      const body = action === "accept" && payload.type === "durable_note"
        ? JSON.stringify({
            title,
            bodyMarkdown,
            tagNames: tagText.split(",").map((tag) => tag.trim()).filter(Boolean),
          })
        : undefined;
      await requestJson(`/api/local-agent/suggestions/${item.id}/${action}`, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body,
      });
      animateSuggestionCollapse(rowRef.current, () => {
        onChanged();
      });
    } catch (reviewError: unknown) {
      setError(reviewError instanceof Error ? reviewError.message : "Suggestion review failed.");
      setBusy(false);
    }
  }

  return (
    <li ref={rowRef} className="workspace-list-row p-4 sm:p-5 bg-[var(--accent-soft)]/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">
            {t("suggestion.label")} &middot; {payload.type}
          </span>
          <h3 className="mt-2 text-base sm:text-lg font-semibold text-[var(--ink)]">{title}</h3>
        </div>
        <span className="text-xs text-[var(--ink-muted)]">
          {payload.type === "relation"
            ? t("suggestion.confidence", { percent: Math.round(payload.confidence * 100) })
            : t("suggestion.sourceCount", { count: item.sourceReferenceCount })}
        </span>
      </div>
      {payload.type === "relation" ? (
        <div className="mt-3.5 space-y-2">
          <p className="text-sm font-medium text-[var(--ink)]">
            {item.relation?.sourceTitle ?? payload.sourceNoteId}
            <span className="px-2 text-[var(--ink-faint)]">&rarr;</span>
            {item.relation?.targetTitle ?? payload.targetNoteId}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">{payload.reason}</p>
          <p className="text-xs text-[var(--ink-muted)]">{t("suggestion.relationType")}: {payload.relationType}</p>
        </div>
      ) : payload.type === "inbox_group" ? (
        <>
          <p className="mt-3.5 whitespace-pre-wrap text-sm leading-6 text-[var(--ink-soft)]">{payload.reason}</p>
          {payload.themes.length > 0 ? (
            <p className="mt-2.5 text-xs text-[var(--ink-muted)]">{t("suggestion.themes")}: {payload.themes.join(" · ")}</p>
          ) : null}
        </>
      ) : (
        <div className="mt-3.5 space-y-3">
          <input
            aria-label={t("suggestion.noteTitle")}
            className="workspace-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="text-xs text-[var(--ink-muted)]">{payload.summary}</p>
          <textarea
            aria-label={t("suggestion.noteMarkdown")}
            className="workspace-textarea min-h-40 font-mono text-xs leading-6"
            value={bodyMarkdown}
            onChange={(event) => setBodyMarkdown(event.target.value)}
          />
          <input
            aria-label={t("suggestion.tags")}
            className="workspace-input text-xs"
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
            placeholder="Tags (comma separated)"
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-2.5">
        {payload.type === "durable_note" || payload.type === "relation" ? (
          <Button size="sm" disabled={busy} aria-busy={busy} onClick={() => void review("accept")}>
            {payload.type === "relation" ? t("suggestion.confirmRelation") : t("suggestion.acceptNote")}
          </Button>
        ) : null}
        <Button size="sm" disabled={busy} variant="ghost" onClick={() => void review("ignore")}>
          {t("suggestion.ignore")}
        </Button>
        <Button size="sm" disabled={busy} variant="destructive" onClick={() => void review("reject")}>
          {t("suggestion.reject")}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-[var(--danger)]" role="alert">{error}</p> : null}
    </li>
  );
}

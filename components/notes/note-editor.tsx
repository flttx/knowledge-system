"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { BacklinksPanel } from "@/components/notes/backlinks-panel";
import { LocalGraph } from "@/components/graph/local-graph";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, Surface } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";
import { createAutosaveQueue } from "@/lib/notes/autosave";
import {
  isDraftNewerThan,
  noteDraftKey,
  parseNoteDraft,
  serializeNoteDraft,
  type NoteDraft,
} from "@/lib/notes/draft";

interface NoteData {
  id: string;
  title: string;
  slug: string;
  contentMarkdown: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

interface TagSuggestion {
  id: string;
  name: string;
  noteCount: number;
}

interface NoteSavePayload {
  title: string;
  contentMarkdown: string;
  tagNames: string[];
}

interface ApiErrorPayload {
  error?: { message?: string };
}

type SaveState = "saved" | "saving" | "offline" | "failed";

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? "请求失败，请稍后重试。");
  }
  return body as T;
}

function normalizeClientTag(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase();
}

function saveStateLabel(state: SaveState, translate: (key: "notes.saveState.saved" | "notes.saveState.saving" | "notes.saveState.offline" | "notes.saveState.failed") => string): string {
  if (state === "saving") return translate("notes.saveState.saving");
  if (state === "offline") return translate("notes.saveState.offline");
  if (state === "failed") return translate("notes.saveState.failed");
  return translate("notes.saveState.saved");
}

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<TagSuggestion[]>([]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void requestJson<{ items: TagSuggestion[] }>(
        `/api/tags?limit=8&q=${encodeURIComponent(value.trim())}`,
      )
        .then((result) => setSuggestions(result.items))
        .catch(() => setSuggestions([]));
    }, 120);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  function addTag(name: string): void {
    const trimmed = name.trim();
    if (!trimmed || tags.some((tag) => normalizeClientTag(tag) === normalizeClientTag(trimmed))) {
      setValue("");
      return;
    }
    onChange([...tags, trimmed]);
    setValue("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(value);
    }
    if (event.key === "Backspace" && !value && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  return (
    <div className="relative inline-flex flex-wrap items-center gap-1.5 font-mono text-xs">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-strong)]"
        >
          <span>#{tag}</span>
          <button
            type="button"
            aria-label={t("notes.removeTag", { tag })}
            className="rounded-full hover:bg-[var(--accent-strong)]/20 p-0.5 text-xs leading-none"
            onClick={() => onChange(tags.filter((val) => val !== tag))}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        aria-label={t("notes.addTag")}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder={tags.length ? "+ 标签" : "+ 添加标签 (Enter 确认)"}
        className="min-w-[7rem] bg-transparent py-0.5 text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
      />
      {value && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 top-8 z-20 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-lg min-w-[12rem]"
          aria-label={t("notes.tagsSuggestion")}
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-[var(--surface-muted)] transition-colors"
                onClick={() => addTag(suggestion.name)}
              >
                <span className="font-medium text-[var(--ink)]">#{suggestion.name}</span>
                <span className="text-[10px] text-[var(--ink-faint)]">{suggestion.noteCount}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function NoteEditor({ noteId }: { noteId: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [note, setNote] = useState<NoteData | null>(null);
  const [title, setTitle] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [tagNames, setTagNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [draftRestored, setDraftRestored] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const hydratedRef = useRef(false);
  const dirtyRef = useRef(false);
  const titleRef = useRef("");
  const contentRef = useRef("");
  const tagNamesRef = useRef<string[]>([]);
  const editRevisionRef = useRef(0);
  const saveQueueRef = useRef(createAutosaveQueue());

  const setEditorValues = useCallback((nextTitle: string, nextContent: string, nextTags: string[]) => {
    titleRef.current = nextTitle;
    contentRef.current = nextContent;
    tagNamesRef.current = nextTags;
    setTitle(nextTitle);
    setContentMarkdown(nextContent);
    setTagNames(nextTags);
  }, []);

  const loadNote = useCallback(async (): Promise<void> => {
    setLoading(true);
    setLoadError(null);
    try {
      const result = await requestJson<NoteData>(`/api/notes/${noteId}`);
      setNote(result);
      const draft = parseNoteDraft(window.localStorage.getItem(noteDraftKey(noteId)));
      if (draft && isDraftNewerThan(draft, result.updatedAt)) {
        setEditorValues(draft.title, draft.contentMarkdown, draft.tagNames);
        dirtyRef.current = true;
        setSaveState("offline");
        setDraftRestored(true);
      } else {
        if (draft) window.localStorage.removeItem(noteDraftKey(noteId));
        setEditorValues(result.title, result.contentMarkdown, result.tags);
        dirtyRef.current = false;
        setDraftRestored(false);
        setSaveState("saved");
      }
      hydratedRef.current = true;
    } catch (error: unknown) {
      setLoadError(error instanceof Error ? error.message : "笔记加载失败。");
    } finally {
      setLoading(false);
    }
  }, [noteId, setEditorValues]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadNote(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadNote]);

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current) return;
    const draft: NoteDraft = {
      title: titleRef.current,
      contentMarkdown: contentRef.current,
      tagNames: tagNamesRef.current,
      savedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(noteDraftKey(noteId), serializeNoteDraft(draft));
  }, [contentMarkdown, noteId, tagNames, title]);

  const saveNote = useCallback(async (): Promise<boolean> => {
    if (!hydratedRef.current || !dirtyRef.current) return true;
    if (!titleRef.current.trim()) {
      setSaveState("failed");
      setSaveError("标题不能为空。");
      return false;
    }
    const revision = editRevisionRef.current;
    const payload: NoteSavePayload = {
      title: titleRef.current,
      contentMarkdown: contentRef.current,
      tagNames: [...tagNamesRef.current],
    };

    return saveQueueRef.current.enqueue(async () => {
      setSaveState("saving");
      setSaveError(null);
      try {
        const updated = await requestJson<NoteData>(`/api/notes/${noteId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (revision !== editRevisionRef.current) return true;
        setNote(updated);
        dirtyRef.current = false;
        window.localStorage.removeItem(noteDraftKey(noteId));
        setDraftRestored(false);
        setSaveState("saved");
        return true;
      } catch (error: unknown) {
        if (revision === editRevisionRef.current) {
          const networkFailure = error instanceof TypeError;
          setSaveState(networkFailure ? "offline" : "failed");
          setSaveError(error instanceof Error ? error.message : "保存失败，请重试。");
        }
        return false;
      }
    });
  }, [noteId]);

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current) return;
    const timeoutId = window.setTimeout(() => void saveNote(), 900);
    return () => window.clearTimeout(timeoutId);
  }, [contentMarkdown, saveNote, tagNames, title]);

  function markDirty(): void {
    editRevisionRef.current += 1;
    dirtyRef.current = true;
    setSaveState("saving");
    setSaveError(null);
  }

  function updateTitle(event: ChangeEvent<HTMLInputElement>): void {
    const value = event.target.value;
    titleRef.current = value;
    setTitle(value);
    markDirty();
  }

  function updateContent(value: string): void {
    contentRef.current = value;
    setContentMarkdown(value);
    markDirty();
  }

  function updateTags(values: string[]): void {
    tagNamesRef.current = values;
    setTagNames(values);
    markDirty();
  }

  async function archive(): Promise<void> {
    setArchiving(true);
    try {
      const saved = await saveNote();
      if (!saved) return;
      await requestJson(`/api/notes/${noteId}`, { method: "DELETE" });
      setNote((current) => current ? { ...current, archivedAt: new Date().toISOString() } : current);
      setSaveState("saved");
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "归档失败，请重试。");
    } finally {
      setArchiving(false);
    }
  }

  async function restore(): Promise<void> {
    setArchiving(true);
    try {
      const restored = await requestJson<NoteData>(`/api/notes/${noteId}/restore`, { method: "POST" });
      setNote(restored);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : "恢复失败，请重试。");
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <PageContainer width="writing">
        <Surface className="p-8 text-center text-sm text-[var(--ink-muted)] rounded-2xl border border-[var(--line)]" aria-live="polite">
          {t("common.loading")}
        </Surface>
      </PageContainer>
    );
  }

  if (loadError || !note) {
    return (
      <PageContainer width="writing">
        <div className="rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]" role="alert">
          <p>{loadError ?? t("common.error")}</p>
          <Button className="mt-3" size="sm" variant="secondary" onClick={() => void loadNote()}>
            {t("common.retry")}
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="writing">
      {/* Top Header Navigation & Live Save State */}
      <PageHeader className="items-center justify-between pb-3 border-b border-[var(--line)]">
        <Link
          href="/notes"
          className="group text-xs font-mono font-medium text-[var(--ink-muted)] hover:text-[var(--accent-strong)] inline-flex items-center gap-1.5 transition-colors"
        >
          <span className="transition-transform group-hover:-translate-x-0.5" aria-hidden="true">&larr;</span>
          <span>{t("notes.back")}</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Status Indicator Capsule */}
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-[11px] font-mono shadow-2xs">
            <span
              className={`size-1.5 rounded-full ${
                saveState === "saving"
                  ? "bg-amber-400 animate-ping"
                  : saveState === "failed"
                  ? "bg-red-500"
                  : "bg-[var(--accent)]"
              }`}
            />
            <span className="text-[var(--ink-muted)]" role="status" aria-live="polite">
              {saveStateLabel(saveState, t)}
            </span>
          </div>

          {saveState === "failed" || saveState === "offline" ? (
            <Button size="sm" variant="secondary" onClick={() => void saveNote()}>
              {t("notes.retrySave")}
            </Button>
          ) : null}

          {note.archivedAt ? (
            <Button size="sm" variant="secondary" disabled={archiving} onClick={() => void restore()}>
              {t("notes.restore")}
            </Button>
          ) : (
            <Button size="sm" variant="secondary" disabled={archiving} onClick={() => void archive()}>
              {t("notes.archive")}
            </Button>
          )}
        </div>
      </PageHeader>

      {draftRestored && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-xs text-amber-900 font-sans" role="status">
          {t("notes.restoreDraft")}
        </div>
      )}

      {saveError && (
        <div className="mt-4 rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)] font-sans" role="alert">
          {saveError} {t("notes.draftKept")}
        </div>
      )}

      {/* Main Classical Editorial Surface */}
      <main className="mt-6">
        {/* Title Input */}
        <input
          aria-label={t("notes.titleLabel")}
          value={title}
          onChange={updateTitle}
          placeholder={t("notes.titlePlaceholder")}
          className="workspace-note-title w-full border-0 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] leading-snug font-serif text-3xl sm:text-4xl font-normal tracking-tight selection:bg-[var(--accent-soft)]"
        />

        {/* Minimalist Inline Tag & Metadata Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-2xs font-sans">
          <div className="flex items-center gap-2">
            <TagInput tags={tagNames} onChange={updateTags} />
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--ink-faint)]">
            <span>
              {new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(note.createdAt))}
            </span>
            <span>&middot;</span>
            <span>
              {new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(note.updatedAt))} 更新
            </span>
          </div>
        </div>

        {/* Paper Markdown Editor Surface */}
        <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden focus-within:border-[var(--accent)] focus-within:shadow-md transition-all">
          <MarkdownEditor
            value={contentMarkdown}
            onChange={updateContent}
            onSave={() => void saveNote()}
            onCreateNewNote={(newTitle) => router.push(`/notes?newTitle=${encodeURIComponent(newTitle)}`)}
            disabled={Boolean(note.archivedAt)}
          />
        </div>
      </main>

      {/* Connected Graph & Backlinks Section */}
      <div className="mt-10 pt-8 border-t border-[var(--line)]">
        <BacklinksPanel noteId={noteId} />
        <LocalGraph noteId={noteId} />
      </div>
    </PageContainer>
  );
}

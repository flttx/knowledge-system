"use client";

import { ReturnLink } from "@/components/ui/workflow";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";

import { MarkdownEditor } from "@/components/editor/markdown-editor";
import { MarkdownPreview } from "@/components/editor/markdown-preview";
import { BacklinksPanel } from "@/components/notes/backlinks-panel";
import { LocalGraph } from "@/components/graph/local-graph";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/ui/workspace";
import { SkeletonNoteDetail } from "@/components/ui/skeleton";
import { useI18n } from "@/components/i18n/locale-provider";
import { requestJson } from "@/lib/api/client";
import { createAutosaveQueue } from "@/lib/notes/autosave";
import { recordLastEditedNote } from "@/lib/notes/last-note";
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

type SaveState = "pending" | "saved" | "saving" | "offline" | "failed";
type NoteMode = "preview" | "edit";

function normalizeClientTag(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase();
}

function saveStateLabel(state: SaveState, translate: (key: "workflow.pendingSave" | "notes.saveState.saved" | "notes.saveState.saving" | "notes.saveState.offline" | "notes.saveState.failed") => string): string {
  if (state === "pending") return translate("workflow.pendingSave");
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
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!value.trim()) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      void requestJson<{ items: TagSuggestion[] }>(
        `/api/tags?limit=8&q=${encodeURIComponent(value.trim())}`,
      )
        .then((result) => {
          setSuggestions(result.items);
          setIsOpen(result.items.length > 0);
        })
        .catch(() => {
          setSuggestions([]);
          setIsOpen(false);
        });
    }, 120);
    return () => window.clearTimeout(timeoutId);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function addTag(name: string): void {
    const trimmed = name.trim();
    if (!trimmed || tags.some((tag) => normalizeClientTag(tag) === normalizeClientTag(trimmed))) {
      setValue("");
      setIsOpen(false);
      return;
    }
    onChange([...tags, trimmed]);
    setValue("");
    setIsOpen(false);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(value);
    }
    if (event.key === "Backspace" && !value && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative inline-flex flex-wrap items-center gap-1.5 font-mono text-xs">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-strong)]"
        >
          <span>#{tag}</span>
          <button
            type="button"
            aria-label={t("notes.removeTag", { tag })}
            className="rounded-full hover:bg-[var(--accent-strong)]/20 p-0.5 text-xs leading-none cursor-pointer"
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
        onFocus={() => {
          if (value.trim() && suggestions.length > 0) setIsOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={tags.length ? "+ 标签" : "+ 添加标签 (Enter 确认)"}
        className="min-w-[7rem] bg-transparent py-0.5 text-xs text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)]"
      />
      {isOpen && suggestions.length > 0 ? (
        <ul
          className="absolute left-0 top-8 z-20 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-lg min-w-[12rem]"
          aria-label={t("notes.tagsSuggestion")}
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
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
  const [mode, setMode] = useState<NoteMode>("preview");
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
        setMode(result.archivedAt ? "preview" : "edit");
      } else {
        if (draft) window.localStorage.removeItem(noteDraftKey(noteId));
        setEditorValues(result.title, result.contentMarkdown, result.tags);
        dirtyRef.current = false;
        setDraftRestored(false);
        setSaveState("saved");
        setMode("preview");
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
        recordLastEditedNote(noteId, payload.title);
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

  // Record active note when loaded
  useEffect(() => {
    if (note) {
      recordLastEditedNote(note.id, note.title);
    }
  }, [note]);

  // Immediate Autosave Flush on Visibility Change / Page Hide / Switch Apps
  useEffect(() => {
    const handleFlush = () => {
      if (dirtyRef.current) {
        void saveNote();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        handleFlush();
      }
    };

    window.addEventListener("beforeunload", handleFlush);
    window.addEventListener("pagehide", handleFlush);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleGlobalKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void saveNote();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      handleFlush();
      window.removeEventListener("beforeunload", handleFlush);
      window.removeEventListener("pagehide", handleFlush);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [saveNote]);

  useEffect(() => {
    if (!hydratedRef.current || !dirtyRef.current) return;
    const timeoutId = window.setTimeout(() => void saveNote(), 900);
    return () => window.clearTimeout(timeoutId);
  }, [contentMarkdown, saveNote, tagNames, title]);

  function markDirty(): void {
    editRevisionRef.current += 1;
    dirtyRef.current = true;
    setSaveState("pending");
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
    return <SkeletonNoteDetail />;
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
        <ReturnLink fallback="/notes" />

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

          {!note.archivedAt ? (
            <Button size="sm" variant="secondary" onClick={() => setMode((current) => current === "preview" ? "edit" : "preview")}>
              {mode === "preview" ? t("inbox.edit") : locale === "zh-CN" ? "预览" : "Preview"}
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
        {mode === "edit" ? (
          <input
            aria-label={t("notes.titleLabel")}
            value={title}
            onChange={updateTitle}
            placeholder={t("notes.titlePlaceholder")}
            autoCapitalize="sentences"
            autoCorrect="on"
            spellCheck={true}
            inputMode="text"
            className="workspace-note-title w-full border-0 bg-transparent text-[var(--ink)] outline-none placeholder:text-[var(--ink-faint)] leading-snug font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight selection:bg-[var(--accent-soft)]"
          />
        ) : (
          <h1 className="workspace-note-title text-[var(--ink)] leading-snug font-serif text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight">
            {title}
          </h1>
        )}

        {/* Minimalist Inline Tag & Metadata Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-2xs font-sans">
          <div className="flex items-center gap-2 min-w-0">
            {mode === "edit" ? (
              <TagInput tags={tagNames} onChange={updateTags} />
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {tagNames.length > 0 ? tagNames.map((tag) => (
                  <span key={tag} className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-mono font-medium text-[var(--accent-strong)]">
                    #{tag}
                  </span>
                )) : <span className="text-xs text-[var(--ink-faint)]">{t("notes.addTag")}</span>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--ink-faint)] shrink-0">
            <span>
              {contentMarkdown.trim() ? `${contentMarkdown.trim().length} 字` : "0 字"}
            </span>
            <span>&middot;</span>
            <span>
              {new Intl.DateTimeFormat(locale, { dateStyle: "short" }).format(new Date(note.createdAt))}
            </span>
            <span>&middot;</span>
            <span>
              {new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(note.updatedAt))} 更新
            </span>
          </div>
        </div>

        {mode === "edit" ? (
          <div className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] overflow-hidden focus-within:border-[var(--accent-strong)] focus-within:shadow-[0_4px_24px_rgba(201,168,93,0.12)] transition-all">
            <MarkdownEditor
              value={contentMarkdown}
              onChange={updateContent}
              onSave={() => void saveNote()}
              onCreateNewNote={(newTitle) => router.push(`/notes?newTitle=${encodeURIComponent(newTitle)}`)}
              noteId={noteId}
              disabled={Boolean(note.archivedAt)}
            />
          </div>
        ) : (
          <article className="mt-5 rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-5 py-6 shadow-[var(--shadow-card)] sm:px-7 sm:py-8">
            {contentMarkdown.trim() ? (
              <MarkdownPreview markdown={contentMarkdown} className="markdown-preview--detail" />
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">{t("notes.noContent")}</p>
            )}
          </article>
        )}
      </main>

      {/* Connected Graph & Backlinks Section */}
      <div className="mt-12 space-y-8 pt-8 border-t border-[var(--line)]">
        <BacklinksPanel noteId={noteId} />
        <LocalGraph noteId={noteId} />
      </div>
    </PageContainer>
  );
}

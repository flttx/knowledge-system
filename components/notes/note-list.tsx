"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, EmptyState, WorkspaceDialog } from "@/components/ui/workspace";
import { SkeletonNoteList } from "@/components/ui/skeleton";
import { MotionList } from "@/components/motion/MotionList";
import { useI18n } from "@/components/i18n/locale-provider";
import { NoteIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { requestJson } from "@/lib/api/client";

interface NoteSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  updatedAt: string;
  archivedAt: string | null;
}

interface TagSuggestion {
  id: string;
  name: string;
  noteCount: number;
}

function formatDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

export function NoteList() {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [items, setItems] = useState<NoteSummary[]>([]);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const tagFilterRef = useRef<HTMLDivElement>(null);
  const [archived, setArchived] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTags, setNewTags] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q.trim()) params.set("q", q.trim());
      if (tag) params.set("tag", tag);
      if (archived) params.set("archived", "true");
      const result = await requestJson<{ items: NoteSummary[] }>(`/api/notes?${params}`);
      setItems(result.items);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [archived, q, tag, t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const requestedTitle = new URLSearchParams(window.location.search).get("newTitle");
      if (requestedTitle) {
        setNewTitle(requestedTitle);
        setCreateOpen(true);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadNotes(), 150);
    return () => window.clearTimeout(timeoutId);
  }, [loadNotes]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!tagInput.trim()) {
        setTagSuggestions([]);
        setTagDropdownOpen(false);
        return;
      }
      void requestJson<{ items: TagSuggestion[] }>(
        `/api/tags?limit=12&q=${encodeURIComponent(tagInput.trim())}`,
      )
        .then((result) => {
          setTagSuggestions(result.items);
          setTagDropdownOpen(result.items.length > 0);
        })
        .catch(() => {
          setTagSuggestions([]);
          setTagDropdownOpen(false);
        });
    }, 150);
    return () => window.clearTimeout(timeoutId);
  }, [tagInput]);

  useEffect(() => {
    if (!tagDropdownOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (tagFilterRef.current && !tagFilterRef.current.contains(event.target as Node)) {
        setTagDropdownOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setTagDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [tagDropdownOpen]);

  async function createNote(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const tagNames = newTags.split(",").map((value) => value.trim()).filter(Boolean);
      const note = await requestJson<{ id: string }>("/api/notes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: newTitle, contentMarkdown: "", tagNames }),
      });
      setCreateOpen(false);
      router.push(`/notes/${note.id}`);
    } catch (createError: unknown) {
      setError(createError instanceof Error ? createError.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer width="list">
      {/* Top Header */}
      <PageHeader className="items-center justify-between pb-4 border-b border-[var(--line)]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--ink-muted)] mb-2 shadow-2xs">
            <span className="size-1.5 rounded-full bg-[var(--accent)]" />
            <span>MARKDOWN 知识笔记</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ink)]">
            {t("layout.notesTitle")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--ink-muted)] font-light">
            {t("layout.notesDescription")}
          </p>
        </div>

        <div className="workspace-header-actions flex items-center gap-3">
          <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--ink-muted)]">
            {items.length} 篇{archived ? "已归档" : "活跃"}笔记
          </span>
          {!archived ? (
            <Button
              ref={createTriggerRef}
              size="md"
              onClick={() => setCreateOpen(true)}
              className="h-9 px-4 rounded-lg text-xs font-semibold transition-all shadow-xs gap-1.5"
            >
              <PlusIcon size={13} />
              <span>{t("notes.new")}</span>
            </Button>
          ) : null}
        </div>
      </PageHeader>

      {/* Integrated Search & Filter Strip */}
      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-2 shadow-2xs font-sans">
        {/* Keyword Search Input */}
        <div className="relative min-w-[14rem] flex-1">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-faint)]" />
          <input
            id="note-search"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="搜索笔记标题或内容关键词…"
            className="h-9 w-full rounded-lg border-0 bg-transparent pl-9 pr-3 text-xs text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none focus:bg-[var(--surface-muted)] transition-colors"
          />
        </div>

        <span className="hidden sm:block h-5 w-px bg-[var(--line)]" aria-hidden="true" />

        {/* Tag Filter Input with Autocomplete */}
        <div ref={tagFilterRef} className="relative w-full sm:w-56">
          <input
            id="note-tag-filter"
            value={tagInput || tag}
            onChange={(event) => {
              setTagInput(event.target.value);
              setTag("");
            }}
            onFocus={() => {
              setTagInput(tag);
              if (tagInput.trim() && tagSuggestions.length > 0) setTagDropdownOpen(true);
            }}
            placeholder={tag ? `#${tag}` : "按标签过滤 (#tag)…"}
            className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--surface-muted)]/50 px-3 text-xs font-mono text-[var(--ink)] placeholder-[var(--ink-faint)] outline-none focus:border-[var(--accent)] transition-colors"
          />
          {tagDropdownOpen && tagSuggestions.length > 0 ? (
            <ul
              className="absolute left-0 top-11 z-20 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 shadow-lg w-full"
              aria-label={t("notes.tagsSuggestion")}
            >
              {tagSuggestions.map((suggestion) => (
                <li key={suggestion.id}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-[var(--surface-muted)] transition-colors font-mono cursor-pointer"
                    onClick={() => {
                      setTag(suggestion.name);
                      setTagInput(suggestion.name);
                      setTagDropdownOpen(false);
                    }}
                  >
                    <span className="font-medium text-[var(--ink)]">#{suggestion.name}</span>
                    <span className="text-[10px] text-[var(--ink-faint)]">{suggestion.noteCount}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Archive / Active Switcher Button */}
        <Button
          variant={archived ? "primary" : "secondary"}
          size="sm"
          onClick={() => setArchived((value) => !value)}
          className="h-9 rounded-lg text-xs font-mono font-medium px-3.5 transition-all"
        >
          {archived ? t("notes.showActive") : t("notes.showArchived")}
        </Button>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]" role="alert">
          <p>{error}</p>
          <Button className="mt-2 text-xs" size="sm" variant="secondary" onClick={() => void loadNotes()}>
            {t("common.retry")}
          </Button>
        </div>
      ) : null}

      {/* Note Card Stream List */}
      <div className="mt-6">
        <section aria-labelledby="notes-list-heading">
          <h2 id="notes-list-heading" className="sr-only">{t("nav.notes")}</h2>
          {loading ? (
            <SkeletonNoteList count={5} />
          ) : items.length === 0 ? (
            <EmptyState
              title={archived ? t("notes.emptyArchived") : t("notes.empty")}
              description={archived ? "归档的笔记会存放在这里。" : "开始记录第一篇笔记吧，支持双向链接和即时保存。"}
              action={
                !archived ? (
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    {t("notes.new")}
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <MotionList className="grid gap-3.5" triggerKey={loading ? "loading" : "loaded"}>
              {items.map((item) => (
                <li
                  key={item.id}
                  className="group relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] hover:shadow-xs transition-all list-none"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/notes/${item.id}`}
                        className="font-serif text-base sm:text-lg font-medium text-[var(--ink)] group-hover:text-[var(--accent-strong)] transition-colors leading-snug"
                      >
                        {item.title}
                      </Link>
                      <p className="mt-2 line-clamp-2 max-w-3xl text-xs sm:text-sm leading-relaxed text-[var(--ink-muted)] font-light font-sans">
                        {item.excerpt ? item.excerpt.replace(/\\n/g, " ").replace(/\|/g, " ").trim() : t("notes.noContent")}
                      </p>
                    </div>

                    <time className="shrink-0 text-[11px] font-mono text-[var(--ink-faint)]" dateTime={item.updatedAt}>
                      {formatDate(item.updatedAt, locale)}
                    </time>
                  </div>

                  {/* Bottom Tags Strip */}
                  {item.tags.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[var(--line)] flex flex-wrap items-center gap-1.5">
                      <NoteIcon size={12} className="text-[var(--ink-faint)] mr-1" />
                      {item.tags.map((itemTag) => (
                        <button
                          type="button"
                          key={itemTag}
                          onClick={() => {
                            setTag(itemTag);
                            setTagInput(itemTag);
                          }}
                          className="inline-flex items-center rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-mono text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)] transition-colors"
                        >
                          #{itemTag}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </MotionList>
          )}
        </section>

        {/* Create Note Modal Dialog */}
        <WorkspaceDialog
          closeLabel={t("layout.close")}
          onClose={() => {
            setCreateOpen(false);
            createTriggerRef.current?.focus();
          }}
          open={createOpen}
          title={t("notes.new")}
        >
          <form className="space-y-4 font-sans" onSubmit={(event) => void createNote(event)}>
            <label className="block text-xs font-semibold text-[var(--ink)]">
              {t("notes.titleLabel")}
              <input
                required
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="例如：系统思考与双向拓扑"
                className="workspace-input mt-1"
              />
            </label>
            <label className="block text-xs font-semibold text-[var(--ink)]">
              {t("notes.tagsLabel")}
              <span className="mt-0.5 block text-[11px] font-normal text-[var(--ink-faint)]">{t("notes.tagsHint")}</span>
              <input
                value={newTags}
                onChange={(event) => setNewTags(event.target.value)}
                placeholder="思维模型, 认知"
                className="workspace-input mt-1 font-mono text-xs"
              />
            </label>
            <div className="pt-2">
              <Button className="w-full h-10 rounded-lg font-medium text-xs" type="submit" disabled={saving} aria-busy={saving} size="md">
                {saving ? t("notes.creating") : t("notes.create")}
              </Button>
            </div>
          </form>
        </WorkspaceDialog>
      </div>
    </PageContainer>
  );
}

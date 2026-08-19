"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, WorkspaceDialog } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";

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

interface ApiErrorPayload {
  error?: { message?: string };
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? "请求失败，请稍后重试。");
  }
  return body as T;
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
      void requestJson<{ items: TagSuggestion[] }>(
        `/api/tags?limit=12&q=${encodeURIComponent(tagInput.trim())}`,
      )
        .then((result) => setTagSuggestions(result.items))
        .catch(() => setTagSuggestions([]));
    }, 150);
    return () => window.clearTimeout(timeoutId);
  }, [tagInput]);

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
      <PageHeader>
        <div>
          <p className="workspace-eyebrow">{t("notes.eyebrow")}</p>
          <h1 className="workspace-page-title">{t("layout.notesTitle")}</h1>
          <p className="workspace-page-description">{t("layout.notesDescription")}</p>
        </div>
        <div className="workspace-header-actions">
          <span className="text-sm text-[var(--ink-muted)]">{items.length} 篇{archived ? "已归档" : "活跃"}笔记</span>
          {!archived ? <Button ref={createTriggerRef} onClick={() => setCreateOpen(true)}>{t("notes.new")}</Button> : null}
        </div>
      </PageHeader>

      <div className="mt-7 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,16rem)_auto]">
        <label className="sr-only" htmlFor="note-search">{t("notes.search")}</label>
        <input id="note-search" value={q} onChange={(event) => setQ(event.target.value)} placeholder={t("notes.search")} className="workspace-input" />
        <div className="relative">
          <label className="sr-only" htmlFor="note-tag-filter">{t("notes.filterTag")}</label>
          <input id="note-tag-filter" value={tagInput || tag} onChange={(event) => { setTagInput(event.target.value); setTag(""); }} onFocus={() => setTagInput(tag)} placeholder={t("notes.filterTag")} className="workspace-input" />
          {tagInput && tagSuggestions.length > 0 ? <ul className="absolute inset-x-0 top-12 z-10 rounded-xl border border-[var(--line)] bg-white p-1 shadow-sm" aria-label={t("notes.tagsSuggestion")}>{tagSuggestions.map((suggestion) => <li key={suggestion.id}><button type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[var(--surface-muted)]" onClick={() => { setTag(suggestion.name); setTagInput(suggestion.name); }}>{suggestion.name}<span className="text-xs text-[var(--ink-faint)]">{suggestion.noteCount}</span></button></li>)}</ul> : null}
        </div>
        <Button variant={archived ? "primary" : "secondary"} onClick={() => setArchived((value) => !value)}>{archived ? t("notes.showActive") : t("notes.showArchived")}</Button>
      </div>

      {error ? <div className="mt-5 rounded-2xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert"><p>{error}</p><Button className="mt-3" variant="secondary" onClick={() => void loadNotes()}>{t("common.retry")}</Button></div> : null}

      <div className="mt-8">
        <section aria-labelledby="notes-list-heading">
          <h2 id="notes-list-heading" className="sr-only">{t("nav.notes")}</h2>
          {loading ? <div className="border-y border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]" aria-live="polite">{t("notes.loading")}</div> : items.length === 0 ? <div className="workspace-empty">{archived ? t("notes.emptyArchived") : t("notes.empty")}</div> : <ul className="workspace-surface">{items.map((item) => <li key={item.id} className="px-4 py-4 sm:px-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><Link href={`/notes/${item.id}`} className="text-lg font-semibold text-[var(--ink)] hover:text-[var(--accent-strong)]">{item.title}</Link><p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-[var(--ink-muted)]">{item.excerpt || t("notes.noContent")}</p></div><time className="shrink-0 text-xs text-[var(--ink-faint)]" dateTime={item.updatedAt}>{formatDate(item.updatedAt, locale)}</time></div><div className="mt-3 flex flex-wrap gap-2">{item.tags.map((itemTag) => <button type="button" key={itemTag} onClick={() => { setTag(itemTag); setTagInput(itemTag); }} className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-strong)]">{itemTag}</button>)}</div></li>)}</ul>}
        </section>

        <WorkspaceDialog closeLabel={t("layout.close")} onClose={() => { setCreateOpen(false); createTriggerRef.current?.focus(); }} open={createOpen} title={t("notes.new")}>
          <form className="mt-5 space-y-4" onSubmit={(event) => void createNote(event)}>
            <label className="block text-sm font-medium">{t("notes.titleLabel")}<input required value={newTitle} onChange={(event) => setNewTitle(event.target.value)} className="workspace-input mt-1.5" /></label>
            <label className="block text-sm font-medium">{t("notes.tagsLabel")}<span className="mt-1.5 block text-xs font-normal text-[var(--ink-faint)]">{t("notes.tagsHint")}</span><input value={newTags} onChange={(event) => setNewTags(event.target.value)} placeholder={t("notes.tagsPlaceholder")} className="workspace-input mt-1.5" /></label>
            <Button type="submit" disabled={saving} aria-busy={saving}>{saving ? t("notes.creating") : t("notes.create")}</Button>
          </form>
        </WorkspaceDialog>
      </div>
    </PageContainer>
  );
}

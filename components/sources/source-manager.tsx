"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader, WorkspaceDialog } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";

const sourceTypeOptions = [
  ["article", "文章"],
  ["magazine", "杂志"],
  ["pdf", "PDF"],
  ["book", "书籍"],
  ["web", "网页"],
  ["other", "其他"],
] as const;

type SourceType = (typeof sourceTypeOptions)[number][0];

interface SourceSummary {
  id: string;
  title: string;
  publication: string | null;
  sourceType: SourceType;
  publishedAt: string | null;
  highlightCount: number;
}

interface SourceFormState {
  title: string;
  publication: string;
  author: string;
  issue: string;
  sourceType: SourceType;
  url: string;
  publishedAt: string;
}

interface ApiErrorPayload {
  error?: { message?: string };
}

const emptyForm: SourceFormState = {
  title: "",
  publication: "",
  author: "",
  issue: "",
  sourceType: "article",
  url: "",
  publishedAt: "",
};

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    const message = (body as ApiErrorPayload | null)?.error?.message;
    throw new Error(message ?? "请求失败，请稍后重试。");
  }
  return body as T;
}

function formatDate(value: string | null, locale: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

function sourceTypeLabel(value: SourceType, t: (key: "library.types.article" | "library.types.magazine" | "library.types.pdf" | "library.types.book" | "library.types.web" | "library.types.other") => string): string {
  const keys = { article: "library.types.article", magazine: "library.types.magazine", pdf: "library.types.pdf", book: "library.types.book", web: "library.types.web", other: "library.types.other" } as const;
  return t(keys[value]);
}

export function SourceManager() {
  const { locale, t } = useI18n();
  const [items, setItems] = useState<SourceSummary[]>([]);
  const [form, setForm] = useState<SourceFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const createTriggerRef = useRef<HTMLButtonElement>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSources = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<{ items: SourceSummary[] }>("/api/sources?limit=100");
      setItems(result.items);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "来源加载失败。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadSources(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadSources]);

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await requestJson<SourceSummary>("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          publishedAt: form.publishedAt || null,
          publication: form.publication || null,
          author: form.author || null,
          issue: form.issue || null,
          url: form.url || null,
        }),
      });
      setForm(emptyForm);
      setCreateOpen(false);
      await loadSources();
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "来源保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function archiveSource(id: string): Promise<void> {
    setError(null);
    try {
      await requestJson<SourceSummary>(`/api/sources/${id}`, { method: "DELETE" });
      await loadSources();
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : "来源归档失败。");
    }
  }

  return (
    <PageContainer width="list">
      <section aria-labelledby="source-list-heading">
        <PageHeader>
          <div>
            <p className="workspace-eyebrow">{t("library.eyebrow")}</p>
            <h1 id="source-list-heading" className="workspace-page-title">{t("layout.libraryTitle")}</h1>
            <p className="workspace-page-description">{t("layout.libraryDescription")}</p>
          </div>
          <div className="workspace-header-actions">
            <span className="text-sm text-[var(--ink-muted)]">{t("library.count", { count: items.length })}</span>
            <Button ref={createTriggerRef} onClick={() => setCreateOpen(true)}>{t("library.new")}</Button>
          </div>
        </PageHeader>

        {error ? (
          <div className="mt-6 rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert">
            <p>{error}</p>
            <Button className="mt-3" variant="secondary" onClick={() => void loadSources()}>{t("common.retry")}</Button>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 border-y border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]" aria-live="polite">{t("library.loading")}</div>
        ) : items.length === 0 ? (
          <div className="mt-6 workspace-empty">{t("library.empty")}</div>
        ) : (
          <ul className="workspace-surface mt-6">
            {items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-5">
                <div className="min-w-0">
                  <Link href={`/library/${item.id}`} className="font-semibold text-[var(--ink)] hover:text-[var(--accent-strong)]">{item.title}</Link>
                  <p className="mt-2 text-sm text-[var(--ink-muted)]">{item.publication || t("library.unpublishedPublication")} · {sourceTypeLabel(item.sourceType, t)}</p>
                  <p className="mt-1 text-xs text-[var(--ink-faint)]">{formatDate(item.publishedAt, locale)} · {t("library.highlightCount", { count: item.highlightCount })}</p>
                </div>
                <Button variant="ghost" onClick={() => void archiveSource(item.id)}>{t("library.archive")}</Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <WorkspaceDialog closeLabel={t("layout.close")} onClose={() => { setCreateOpen(false); createTriggerRef.current?.focus(); }} open={createOpen} title={t("library.new")}>
        <form className="mt-5 space-y-4" onSubmit={(event) => void handleCreate(event)}>
          <label className="block text-sm font-medium">{t("library.titleLabel")}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.type")}<select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value as SourceType })} className="workspace-input mt-1.5">{sourceTypeOptions.map(([key]) => <option key={key} value={key}>{sourceTypeLabel(key, t)}</option>)}</select></label>
          <label className="block text-sm font-medium">{t("library.publication")}<input value={form.publication} onChange={(event) => setForm({ ...form, publication: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.author")}<input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.publishedAt")}<input type="date" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.url")}<input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="workspace-input mt-1.5" /></label>
          <Button type="submit" disabled={saving} aria-busy={saving}>{saving ? t("library.saving") : t("library.save")}</Button>
        </form>
      </WorkspaceDialog>
    </PageContainer>
  );
}

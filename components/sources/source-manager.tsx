"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { MotionList } from "@/components/motion/MotionList";
import { EmptyState, PageContainer, PageHeader, WorkspaceDialog } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";
import { NoteIcon, PlusIcon } from "@/components/icons";

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
        <PageHeader className="items-center justify-between pb-4 border-b border-[var(--line)]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--ink-muted)] mb-2 shadow-2xs">
              <span className="size-1.5 rounded-full bg-[var(--accent)]" />
              <span>文献与输入源档案</span>
            </div>
            <h1 id="source-list-heading" className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[var(--ink)]">
              {t("layout.libraryTitle")}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--ink-muted)] font-light">
              {t("layout.libraryDescription")}
            </p>
          </div>

          <div className="workspace-header-actions flex items-center gap-3">
            <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-mono text-[var(--ink-muted)]">
              {t("library.count", { count: items.length })}
            </span>
            <Button
              ref={createTriggerRef}
              size="md"
              onClick={() => setCreateOpen(true)}
              className="h-9 px-4 rounded-lg text-xs font-semibold bg-[var(--ink)] text-white hover:bg-[var(--ink-soft)] transition-all shadow-xs gap-1.5"
            >
              <PlusIcon size={13} />
              <span>{t("library.new")}</span>
            </Button>
          </div>
        </PageHeader>

        {error ? (
          <div className="mt-5 rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-xs text-[var(--danger)]" role="alert">
            <p>{error}</p>
            <Button className="mt-2 text-xs" size="sm" variant="secondary" onClick={() => void loadSources()}>
              {t("common.retry")}
            </Button>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-sm text-[var(--ink-muted)]" aria-live="polite">
            {t("library.loading")}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            className="mt-6"
            title={t("library.empty")}
            description="添加文章、书籍或视频作为知识输入来源。"
            action={
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                {t("library.new")}
              </Button>
            }
          />
        ) : (
          <MotionList className="mt-6 grid gap-3.5" triggerKey={loading ? "loading" : "loaded"}>
            {items.map((item) => (
              <li
                key={item.id}
                className="group relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] hover:shadow-xs transition-all list-none flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="rounded border border-[var(--accent)]/30 bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-mono font-medium text-[var(--accent-strong)]">
                      {sourceTypeLabel(item.sourceType, t)}
                    </span>
                    <span className="text-xs font-mono text-[var(--ink-faint)]">
                      {item.publication || t("library.unpublishedPublication")}
                    </span>
                  </div>

                  <Link
                    href={`/library/${item.id}`}
                    className="font-serif text-base sm:text-lg font-medium text-[var(--ink)] group-hover:text-[var(--accent-strong)] transition-colors leading-snug"
                  >
                    {item.title}
                  </Link>

                  <div className="mt-2.5 flex items-center gap-3 text-[11px] font-mono text-[var(--ink-faint)]">
                    <span className="flex items-center gap-1">
                      <NoteIcon size={11} className="text-[var(--ink-muted)]" />
                      <span>{t("library.highlightCount", { count: item.highlightCount })}</span>
                    </span>
                    <span>&middot;</span>
                    <span>{formatDate(item.publishedAt, locale)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/library/${item.id}`}
                    className="inline-flex items-center justify-center h-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors shadow-2xs"
                  >
                    查看详情 &rarr;
                  </Link>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void archiveSource(item.id)}
                    className="text-xs text-[var(--ink-faint)] hover:text-[var(--danger)]"
                  >
                    {t("library.archive")}
                  </Button>
                </div>
              </li>
            ))}
          </MotionList>
        )}
      </section>

      {/* New Source Modal Dialog */}
      <WorkspaceDialog
        closeLabel={t("layout.close")}
        onClose={() => {
          setCreateOpen(false);
          createTriggerRef.current?.focus();
        }}
        open={createOpen}
        title={t("library.new")}
      >
        <form className="space-y-3.5 font-sans" onSubmit={(event) => void handleCreate(event)}>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            {t("library.titleLabel")}
            <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="workspace-input mt-1" />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            {t("library.type")}
            <select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value as SourceType })} className="workspace-input mt-1">
              {sourceTypeOptions.map(([key]) => <option key={key} value={key}>{sourceTypeLabel(key, t)}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            {t("library.publication")}
            <input value={form.publication} onChange={(event) => setForm({ ...form, publication: event.target.value })} className="workspace-input mt-1" />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            {t("library.author")}
            <input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="workspace-input mt-1" />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            {t("library.publishedAt")}
            <input type="date" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} className="workspace-input mt-1" />
          </label>
          <label className="block text-xs font-semibold text-[var(--ink)]">
            {t("library.url")}
            <input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="workspace-input mt-1" />
          </label>
          <div className="pt-2">
            <Button className="w-full h-10 rounded-lg font-medium text-xs" type="submit" disabled={saving} aria-busy={saving} size="md">
              {saving ? t("library.saving") : t("library.save")}
            </Button>
          </div>
        </form>
      </WorkspaceDialog>
    </PageContainer>
  );
}

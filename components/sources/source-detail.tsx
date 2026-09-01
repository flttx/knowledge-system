"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActionBar, PageContainer, Surface } from "@/components/ui/workspace";
import { SkeletonSourceDetail } from "@/components/ui/skeleton";
import { useI18n } from "@/components/i18n/locale-provider";
import { NoteIcon, ShieldIcon } from "@/components/icons";
import { requestJson } from "@/lib/api/client";
import { useSwrQuery } from "@/lib/hooks/use-swr-query";
import { isSafeHttpUrl } from "@/lib/urls/safe-http-url";

interface SourceDetailData {
  id: string;
  title: string;
  publication: string | null;
  author: string | null;
  issue: string | null;
  sourceType: string;
  url: string | null;
  publishedAt: string | null;
  highlightCount: number;
}

interface HighlightData {
  id: string;
  text: string;
  page: number | null;
  personalComment: string | null;
  createdAt: string;
}

interface EditState {
  title: string;
  publication: string;
  author: string;
  issue: string;
  url: string;
  publishedAt: string;
}

export function SourceDetail({ sourceId }: { sourceId: string }) {
  const { t } = useI18n();
  const router = useRouter();

  const {
    data: source,
    loading: sourceLoading,
    error: sourceError,
    mutate: mutateSource,
  } = useSwrQuery<SourceDetailData>(`/api/sources/${sourceId}`);

  const {
    data: highlightsData,
    loading: highlightsLoading,
  } = useSwrQuery<{ items: HighlightData[] }>(`/api/highlights?sourceId=${sourceId}&limit=100`);

  const highlights = highlightsData?.items ?? [];
  const loading = (sourceLoading || highlightsLoading) && !source;
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditState>({
    title: "",
    publication: "",
    author: "",
    issue: "",
    url: "",
    publishedAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function startEdit(): void {
    if (!source) return;
    setForm({
      title: source.title,
      publication: source.publication ?? "",
      author: source.author ?? "",
      issue: source.issue ?? "",
      url: source.url ?? "",
      publishedAt: source.publishedAt?.slice(0, 10) ?? "",
    });
    setEditing(true);
  }

  function cancelEdit(): void {
    setEditing(false);
  }

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setActionError(null);
    try {
      const updated = await requestJson<SourceDetailData>(`/api/sources/${sourceId}`, {
        method: "PATCH",
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
      await mutateSource(updated, true);
      setEditing(false);
    } catch (saveError: unknown) {
      setActionError(saveError instanceof Error ? saveError.message : "来源保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    setActionError(null);
    try {
      await requestJson<SourceDetailData>(`/api/sources/${sourceId}`, { method: "DELETE" });
      router.push("/library");
    } catch (archiveError: unknown) {
      setActionError(archiveError instanceof Error ? archiveError.message : "来源归档失败。");
    }
  }

  if (loading) {
    return <SkeletonSourceDetail />;
  }

  if (!source) {
    return (
      <PageContainer width="detail">
        <div className="rounded-xl border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]" role="alert">
          {sourceError ?? t("common.error")}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="detail">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href="/library"
          className="group inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--ink-muted)] hover:text-[var(--accent-strong)] transition-colors"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">&larr;</span>
          <span>{t("library.back")}</span>
        </Link>
      </div>

      {/* Header Dossier Bar */}
      <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-[var(--line)]">
        <div className="min-w-0 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface-muted)] px-3 py-0.5 text-[11px] font-mono text-[var(--ink-muted)] mb-2.5 shadow-2xs">
            <span className="size-1.5 rounded-full bg-[var(--accent)]" />
            <span className="uppercase font-semibold text-[var(--accent-strong)]">{source.sourceType}</span>
            <span>&middot;</span>
            <span>{t("library.detail")}</span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal leading-tight tracking-tight text-[var(--ink)]">
            {source.title}
          </h1>

          <p className="mt-2.5 text-xs text-[var(--ink-muted)] font-mono flex flex-wrap items-center gap-2">
            <span>{source.publication || t("library.unpublishedPublication")}</span>
            {source.author ? <span>&middot; 著者: {source.author}</span> : null}
            <span>&middot; 共 {source.highlightCount} 条高亮摘录</span>
          </p>
        </div>

        <ActionBar className="shrink-0 pt-1">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => (editing ? cancelEdit() : startEdit())}
            className="rounded-lg shadow-2xs text-xs font-medium"
          >
            {editing ? t("inbox.cancel") : t("library.edit")}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void archive()}
            className="rounded-lg text-xs"
          >
            {t("library.archiveSource")}
          </Button>
        </ActionBar>
      </div>

      {actionError || sourceError ? (
        <p className="mt-4 rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]" role="alert">
          {actionError || sourceError}
        </p>
      ) : null}

      {/* Metadata Dossier Grid */}
      <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] font-sans">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] text-xs font-mono text-[var(--ink-muted)]">
          <span className="flex items-center gap-1.5">
            <ShieldIcon size={12} className="text-[var(--accent)]" />
            <span>文献档案索引</span>
          </span>
          <span>ID: {source.id.slice(0, 8)}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="block text-[11px] font-mono text-[var(--ink-faint)]">出版机构 / 出处</span>
            <span className="mt-1 block font-medium text-[var(--ink)] truncate">
              {source.publication || "—"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-mono text-[var(--ink-faint)]">作者 / 著者</span>
            <span className="mt-1 block font-medium text-[var(--ink)] truncate">
              {source.author || "—"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-mono text-[var(--ink-faint)]">期号 / 卷号</span>
            <span className="mt-1 block font-medium text-[var(--ink)] truncate">
              {source.issue || "—"}
            </span>
          </div>

          <div>
            <span className="block text-[11px] font-mono text-[var(--ink-faint)]">出版日期</span>
            <span className="mt-1 block font-medium text-[var(--ink)]">
              {source.publishedAt
                ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(source.publishedAt))
                : t("library.unpublished")}
            </span>
          </div>
        </div>

        {source.url && (
          <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono text-[var(--ink-faint)]">原始文献链接</span>
            {isSafeHttpUrl(source.url) ? (
              <a
                className="inline-flex items-center gap-1 text-[var(--accent-strong)] hover:underline font-mono text-xs max-w-md truncate"
                href={source.url}
                rel="noreferrer"
                target="_blank"
                title={source.url}
              >
                <span>{source.url}</span>
                <span>&nearr;</span>
              </a>
            ) : (
              <span className="max-w-md truncate font-mono text-xs text-[var(--ink-faint)]" title="该链接不可用">
                链接不可用
              </span>
            )}
          </div>
        )}
      </div>

      {/* Edit Form Modal/Drawer Area */}
      {editing ? (
        <Surface className="mt-6 p-6 rounded-2xl border border-[var(--accent)] bg-[var(--surface)] shadow-md" ariaLabelledBy="edit-source-heading">
          <h2 id="edit-source-heading" className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--accent)]" />
            <span>{t("library.edit")}</span>
          </h2>
          <form className="mt-4 grid gap-3.5 sm:grid-cols-2" onSubmit={(event) => void save(event)}>
            <label className="block text-xs font-semibold text-[var(--ink)] sm:col-span-2">
              {t("library.titleLabel")}
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="workspace-input mt-1" />
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
              {t("library.issue")}
              <input value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} className="workspace-input mt-1" />
            </label>
            <label className="block text-xs font-semibold text-[var(--ink)]">
              {t("library.publishedAt")}
              <input type="date" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} className="workspace-input mt-1" />
            </label>
            <label className="block text-xs font-semibold text-[var(--ink)] sm:col-span-2">
              {t("library.url")}
              <input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="workspace-input mt-1" />
            </label>
            <ActionBar className="sm:col-span-2 pt-3 border-t border-[var(--line)]">
              <Button size="sm" type="button" variant="ghost" onClick={cancelEdit}>{t("inbox.cancel")}</Button>
              <Button size="sm" type="submit" disabled={saving} aria-busy={saving}>{saving ? t("library.saving") : t("library.saveChanges")}</Button>
            </ActionBar>
          </form>
        </Surface>
      ) : null}

      {/* Highlights Cascade Flow */}
      <div className="mt-10">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <NoteIcon size={16} className="text-[var(--accent-strong)]" />
            <h2 className="text-base font-semibold text-[var(--ink)] font-serif">
              {t("library.relatedHighlights")}
            </h2>
          </div>
          <span className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 text-xs font-mono text-[var(--ink-muted)]">
            共 {highlights.length} 条高亮
          </span>
        </div>

        {highlights.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center text-xs text-[var(--ink-muted)]">
            {t("library.noHighlights")}
          </div>
        ) : (
          <div className="mt-4 grid gap-4">
            {highlights.map((highlight) => (
              <div
                key={highlight.id}
                className="group relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] hover:shadow-md transition-all"
              >
                {/* Excerpt Body with Classical Left Accent Border */}
                <div className="flex gap-4">
                  <div className="w-1 rounded-full bg-[var(--accent)]/50 shrink-0 group-hover:bg-[var(--accent-strong)] transition-colors" />
                  <div className="flex-1">
                    <p className="font-serif text-sm sm:text-[15px] leading-relaxed text-[var(--ink)] font-normal selection:bg-[var(--accent-soft)]">
                      {highlight.text}
                    </p>

                    {highlight.personalComment && (
                      <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-muted)]/60 px-4 py-2.5 text-xs sm:text-sm text-[var(--ink-muted)] italic leading-relaxed">
                        <span className="not-italic text-[10px] font-mono text-[var(--ink-faint)] mr-1.5 font-semibold">✦ 批注：</span>
                        {highlight.personalComment}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--line)] text-[11px] font-mono text-[var(--ink-faint)]">
                      <span className="rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[var(--ink-muted)]">
                        {highlight.page ? t("common.page", { page: highlight.page }) : t("inbox.noPage")}
                      </span>
                      <span>
                        {new Intl.DateTimeFormat(undefined, { dateStyle: "short" }).format(new Date(highlight.createdAt))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

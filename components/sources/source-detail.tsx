"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ActionBar, DetailPageHeader, PageContainer, PropertyList, PropertyRow, Section, Surface } from "@/components/ui/workspace";
import { useI18n } from "@/components/i18n/locale-provider";

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

interface ApiErrorPayload {
  error?: { message?: string };
}

interface EditState {
  title: string;
  publication: string;
  author: string;
  issue: string;
  url: string;
  publishedAt: string;
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? "请求失败，请稍后重试。");
  }
  return body as T;
}

export function SourceDetail({ sourceId }: { sourceId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [source, setSource] = useState<SourceDetailData | null>(null);
  const [highlights, setHighlights] = useState<HighlightData[]>([]);
  const [form, setForm] = useState<EditState | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const [sourceData, highlightData] = await Promise.all([
        requestJson<SourceDetailData>(`/api/sources/${sourceId}`),
        requestJson<{ items: HighlightData[] }>(`/api/highlights?sourceId=${sourceId}&limit=100`),
      ]);
      setSource(sourceData);
      setHighlights(highlightData.items);
      setForm({
        title: sourceData.title,
        publication: sourceData.publication ?? "",
        author: sourceData.author ?? "",
        issue: sourceData.issue ?? "",
        url: sourceData.url ?? "",
        publishedAt: sourceData.publishedAt?.slice(0, 10) ?? "",
      });
      setEditing(false);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : "来源加载失败。");
    } finally {
      setLoading(false);
    }
  }, [sourceId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  async function save(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await requestJson<SourceDetailData>(`/api/sources/${sourceId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...form, publishedAt: form.publishedAt || null, publication: form.publication || null, author: form.author || null, issue: form.issue || null, url: form.url || null }),
      });
      setSource(updated);
      setForm({ ...form, publishedAt: updated.publishedAt?.slice(0, 10) ?? "" });
      setEditing(false);
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "来源保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function archive(): Promise<void> {
    setError(null);
    try {
      await requestJson<SourceDetailData>(`/api/sources/${sourceId}`, { method: "DELETE" });
      router.push("/library");
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : "来源归档失败。");
    }
  }

  function cancelEdit(): void {
    setForm({
      title: source?.title ?? "",
      publication: source?.publication ?? "",
      author: source?.author ?? "",
      issue: source?.issue ?? "",
      url: source?.url ?? "",
      publishedAt: source?.publishedAt?.slice(0, 10) ?? "",
    });
    setEditing(false);
  }

  if (loading) return <Surface className="p-6 text-sm text-[var(--ink-muted)]" aria-live="polite">{t("common.loading")}</Surface>;
  if (!source || !form) return <div className="rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-6 text-sm text-[var(--danger)]" role="alert">{error ?? t("common.error")}</div>;

  return (
    <PageContainer width="detail">
      <Link href="/library" className="text-sm font-medium text-[var(--accent-strong)]">← {t("library.back")}</Link>
      <DetailPageHeader className="mt-7">
        <div className="min-w-0">
          <p className="workspace-eyebrow">{t("library.detail")}</p>
          <h1 className="workspace-detail-title">{source.title}</h1>
          <p className="mt-2 text-sm text-[var(--ink-muted)]">{source.publication || t("library.unpublishedPublication")} · {source.sourceType} · {t("library.highlightCount", { count: source.highlightCount })}</p>
        </div>
        <ActionBar className="shrink-0">
          <Button variant="secondary" onClick={() => (editing ? cancelEdit() : setEditing(true))}>{editing ? t("inbox.cancel") : t("library.edit")}</Button>
          <Button variant="ghost" className="text-[var(--danger)]" onClick={() => void archive()}>{t("library.archiveSource")}</Button>
        </ActionBar>
      </DetailPageHeader>
      {error ? <p className="mt-5 rounded-lg bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}

      <Section className="mt-8" title={t("library.detail")}>
        <PropertyList>
          <PropertyRow label={t("library.publication")} value={source.publication || t("library.unpublishedPublication")} />
          <PropertyRow label={t("library.author")} value={source.author || "—"} />
          <PropertyRow label={t("library.issue")} value={source.issue || "—"} />
          <PropertyRow label={t("library.publishedAt")} value={source.publishedAt ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(source.publishedAt)) : t("library.unpublished")} />
          <PropertyRow label={t("library.url")} value={source.url ? <a className="truncate text-[var(--accent-strong)] hover:underline" href={source.url} rel="noreferrer" target="_blank" title={source.url}>{source.url}</a> : "—"} />
        </PropertyList>
      </Section>

      {editing ? <Surface className="mt-8 p-5" ariaLabelledBy="edit-source-heading">
        <h2 id="edit-source-heading" className="text-lg font-semibold">{t("library.edit")}</h2>
        <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => void save(event)}>
          <label className="block text-sm font-medium sm:col-span-2">{t("library.titleLabel")}<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.publication")}<input value={form.publication} onChange={(event) => setForm({ ...form, publication: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.author")}<input value={form.author} onChange={(event) => setForm({ ...form, author: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.issue")}<input value={form.issue} onChange={(event) => setForm({ ...form, issue: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium">{t("library.publishedAt")}<input type="date" value={form.publishedAt} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} className="workspace-input mt-1.5" /></label>
          <label className="block text-sm font-medium sm:col-span-2">{t("library.url")}<input type="url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} className="workspace-input mt-1.5" /></label>
          <ActionBar className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={cancelEdit}>{t("inbox.cancel")}</Button>
            <Button type="submit" disabled={saving} aria-busy={saving}>{saving ? t("library.saving") : t("library.saveChanges")}</Button>
          </ActionBar>
        </form>
      </Surface> : null}

      <Section className="mt-10" title={t("library.relatedHighlights")} action={<span className="text-xs text-[var(--ink-muted)]">{source.highlightCount}</span>}>
        {highlights.length === 0 ? <p className="workspace-empty">{t("library.noHighlights")}</p> : <ul className="workspace-surface">{highlights.map((highlight) => <li key={highlight.id} className="px-4 py-4 sm:px-5"><p className="whitespace-pre-wrap text-[15px] leading-7">{highlight.text}</p>{highlight.personalComment ? <p className="mt-2 text-sm text-[var(--ink-muted)]">{highlight.personalComment}</p> : null}<p className="mt-3 text-xs text-[var(--ink-faint)]">{highlight.page ? t("common.page", { page: highlight.page }) : t("inbox.noPage")}</p></li>)}</ul>}
      </Section>
    </PageContainer>
  );
}

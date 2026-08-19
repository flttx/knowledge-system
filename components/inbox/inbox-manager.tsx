"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
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

export type InboxItem = InboxHighlight | InboxQuickNote | InboxSuggestion;

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
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [comment, setComment] = useState(item.personalComment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/highlights/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, personalComment: comment || null }) });
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
      onChanged();
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : "Highlight archive failed.");
    }
  }

  return <li className="p-5"><div className="flex items-start justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">{t("capture.highlight")}</span><span className="text-xs text-[var(--ink-faint)]">{item.sourceTitle ?? t("common.unlinked")}</span></div>{editing ? <div className="mt-4 space-y-3"><textarea required value={text} onChange={(event) => setText(event.target.value)} className="min-h-24 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]" /><textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t("inbox.commentPlaceholder")} className="min-h-20 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]" /><div className="flex gap-2"><Button disabled={saving} aria-busy={saving} onClick={() => void save()}>{saving ? t("inbox.saving") : t("inbox.save")}</Button><Button variant="ghost" onClick={() => setEditing(false)}>{t("inbox.cancel")}</Button></div></div> : <><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.text}</p>{item.personalComment ? <p className="mt-3 text-sm text-[var(--ink-muted)]">{item.personalComment}</p> : null}<div className="mt-4 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[var(--ink-faint)]">{item.page ? t("common.page", { page: item.page }) : t("inbox.noPage")}</span><span className="flex gap-1"><Button variant="ghost" onClick={() => setEditing(true)}>{t("inbox.edit")}</Button><Button variant="ghost" className="text-[var(--danger)]" onClick={() => void archive()}>{t("inbox.archive")}</Button></span></div></>}{error ? <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}</li>;
}

export function QuickNoteRow({ item, onChanged }: { item: QuickNoteData | SuggestionData; onChanged: () => void }) {
  const { t } = useI18n();
  const isSuggestion = "payload" in item;
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(isSuggestion ? "" : item.content);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isSuggestion) {
    return <SuggestionRow item={item} onChanged={onChanged} />;
  }

  async function save(): Promise<void> {
    setSaving(true);
    setError(null);
    try {
      await requestJson(`/api/quick-notes/${item.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }) });
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
      onChanged();
    } catch (archiveError: unknown) {
      setError(archiveError instanceof Error ? archiveError.message : "Highlight archive failed.");
    }
  }

  return <li className="p-5"><div className="flex items-start justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">{t("capture.quickNote")}</span><span className="text-xs text-[var(--ink-faint)]">{item.sourceTitle ?? t("common.unlinked")}</span></div>{editing ? <div className="mt-4 space-y-3"><textarea required value={content} onChange={(event) => setContent(event.target.value)} className="min-h-24 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]" /><div className="flex gap-2"><Button disabled={saving} aria-busy={saving} onClick={() => void save()}>{saving ? t("inbox.saving") : t("inbox.save")}</Button><Button variant="ghost" onClick={() => setEditing(false)}>{t("inbox.cancel")}</Button></div></div> : <><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{item.content}</p><div className="mt-4 flex justify-end gap-1"><Button variant="ghost" onClick={() => setEditing(true)}>{t("inbox.edit")}</Button><Button variant="ghost" className="text-[var(--danger)]" onClick={() => void archive()}>{t("inbox.archive")}</Button></div></>}{error ? <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}</li>;
}

export function SuggestionRow({ item, onChanged }: { item: SuggestionData; onChanged: () => void }) {
  const { t } = useI18n();
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
      onChanged();
    } catch (reviewError: unknown) {
      setError(reviewError instanceof Error ? reviewError.message : "Suggestion review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--accent-strong)]">
            {t("suggestion.label")} · {payload.type}
          </span>
          <h3 className="mt-2 text-lg font-semibold">{title}</h3>
        </div>
        <span className="text-xs text-[var(--ink-faint)]">
         {payload.type === "relation"
            ? t("suggestion.confidence", { percent: Math.round(payload.confidence * 100) })
            : t("suggestion.sourceCount", { count: item.sourceReferenceCount })}
        </span>
      </div>
      {payload.type === "relation" ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">
            {item.relation?.sourceTitle ?? payload.sourceNoteId}
            <span className="px-2 text-[var(--ink-faint)]">-&gt;</span>
            {item.relation?.targetTitle ?? payload.targetNoteId}
          </p>
          <p className="whitespace-pre-wrap text-sm leading-6">{payload.reason}</p>
          <p className="text-xs text-[var(--ink-muted)]">{t("suggestion.relationType")}: {payload.relationType}</p>
        </div>
      ) : payload.type === "inbox_group" ? (
        <>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-6">{payload.reason}</p>
          {payload.themes.length > 0 ? (
            <p className="mt-3 text-xs text-[var(--ink-muted)]">{t("suggestion.themes")}: {payload.themes.join(" 路 ")}</p>
          ) : null}
        </>
      ) : (
        <div className="mt-4 space-y-3">
          <textarea
            aria-label={t("suggestion.noteTitle")}
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--accent)]"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="text-sm text-[var(--ink-muted)]">{payload.summary}</p>
          <textarea
            aria-label={t("suggestion.noteMarkdown")}
            className="min-h-52 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] p-3 font-mono text-sm leading-6 outline-none focus:border-[var(--accent)]"
            value={bodyMarkdown}
            onChange={(event) => setBodyMarkdown(event.target.value)}
          />
          <input
            aria-label={t("suggestion.tags")}
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            value={tagText}
            onChange={(event) => setTagText(event.target.value)}
          />
        </div>
      )}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {payload.type === "durable_note" || payload.type === "relation" ? (
          <Button disabled={busy} aria-busy={busy} onClick={() => void review("accept")}>
            {payload.type === "relation" ? t("suggestion.confirmRelation") : t("suggestion.acceptNote")}
          </Button>
        ) : null}
        <Button disabled={busy} variant="ghost" onClick={() => void review("ignore")}>
          {t("suggestion.ignore")}
        </Button>
        <Button disabled={busy} variant="ghost" className="text-[var(--danger)]" onClick={() => void review("reject")}>
          {t("suggestion.reject")}
        </Button>
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
    </li>
  );
}

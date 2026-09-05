"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { requestJson } from "@/lib/api/client";
import { notifyWorkflow } from "@/components/ui/workflow";
import type { SuggestionData } from "./inbox-types";
export function SuggestionRow({ item, onChanged }: { item: SuggestionData; onChanged: () => void }) {
  const { t } = useI18n();
  const rowRef = useRef<HTMLLIElement>(null);
  const busyRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const payload = item.payload;
  const [title, setTitle] = useState(
    payload.type === "relation" ? t("suggestion.relationType") : payload.proposedTitle,
  );
  const [bodyMarkdown, setBodyMarkdown] = useState(
    payload.type === "durable_note" ? payload.bodyMarkdown : "",
  );
  const [tagText, setTagText] = useState(
    payload.type === "durable_note" ? payload.suggestedTags.join(", ") : "",
  );

  async function review(action: "ignore" | "reject" | "accept"): Promise<void> {
    if (busyRef.current) return;
    busyRef.current = true;
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
      const result = await requestJson<{ createdNoteId?: string }>(`/api/local-agent/suggestions/${item.id}/${action}`, {
        method: "POST",
        headers: body ? { "content-type": "application/json" } : undefined,
        body,
      });
      notifyWorkflow(t("workflow.updated"), result.createdNoteId ? `/notes/${result.createdNoteId}` : payload.type === "relation" ? `/notes/${payload.targetNoteId}` : undefined);
      onChanged();
    } catch (reviewError: unknown) {
      setError(reviewError instanceof Error ? reviewError.message : "Suggestion review failed.");
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <li tabIndex={-1} data-inbox-key={`ai_suggestion:${item.id}`} ref={rowRef} className="workspace-list-row p-4 sm:p-5 bg-[var(--accent-soft)]/20">
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
            placeholder={t("workflow.tags")}
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

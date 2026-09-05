"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkspaceDialog } from "@/components/ui/workspace";
import { EntityPicker } from "@/components/ui/entity-picker";
import { notifyWorkflow } from "@/components/ui/workflow";
import { useI18n } from "@/components/i18n/locale-provider";
import { useListParams } from "@/lib/hooks/use-list-query";
import { withReturnTo } from "@/lib/workflow";
import { requestJson } from "@/lib/api/client";
import type { InboxItem, InboxView } from "./inbox-types";
export type { InboxItem, InboxView } from "./inbox-types";
export { SuggestionRow } from "./suggestion-row";

type Material = Exclude<InboxItem, { type: "ai_suggestion" }>;
export function MaterialRow({ item, onChanged, view }: { item: Material; onChanged: () => void; view: InboxView }) {
  const { t, locale } = useI18n(); const { currentUrl } = useListParams();
  const [editing, setEditing] = useState(false); const [viewing, setViewing] = useState(false);
  const [busy, setBusy] = useState(false); const pending = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const editTrigger = useRef<HTMLButtonElement>(null);
  const data = item.data;
  const readDraft = () => ({ text: item.type === "highlight" ? item.data.text : item.type === "quick_note" ? item.data.content : "", comment: item.type === "highlight" ? item.data.personalComment ?? "" : item.type === "screenshot" ? item.data.annotation ?? "" : "", sourceId: data.sourceId ?? "", noteId: data.noteId ?? "", page: item.type === "screenshot" ? item.data.page ?? "" : "", location: item.type === "screenshot" ? item.data.location ?? "" : "" });
  const [draft, setDraft] = useState(readDraft);
  const patch = (values: Partial<typeof draft>) => setDraft(prev => ({ ...prev, ...values }));
  const endpoint = `/api/${item.type === "highlight" ? "highlights" : item.type === "quick_note" ? "quick-notes" : "screenshots"}/${item.id}`;
  async function mutate(method: string, body?: object) {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(null);
    try {
      await requestJson(endpoint, { method, ...(body ? { headers: { "content-type": "application/json" }, body: JSON.stringify(body) } : {}) });
      setEditing(false); notifyWorkflow(t("workflow.updated")); onChanged();
    } catch (err) { setError(err instanceof Error ? err.message : t("common.error")); }
    finally { pending.current = false; setBusy(false); }
  }
  function save() {
    const links = { sourceId: draft.sourceId || null, noteId: draft.noteId || null };
    return mutate("PATCH", item.type === "highlight" ? { ...links, text: draft.text, personalComment: draft.comment || null } : item.type === "quick_note" ? { ...links, content: draft.text } : { ...links, annotation: draft.comment || null, page: draft.page || null, location: draft.location || null });
  }
  return <li data-inbox-key={`${item.type}:${item.id}`} tabIndex={-1} className="workspace-list-row rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
    <div className="flex flex-wrap justify-between gap-2 text-xs text-[var(--ink-muted)]"><span>{t(item.type === "highlight" ? "capture.highlight" : item.type === "quick_note" ? "capture.quickNote" : "capture.screenshot")}</span><time dateTime={data.createdAt}>{new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(data.createdAt))}</time></div>
    {item.type === "screenshot" && <><button type="button" className="my-3 block w-full rounded-lg bg-black/90 p-2" onClick={() => setViewing(true)} aria-label={t("inbox.viewOriginal")}>
      <img className="mx-auto max-h-72 max-w-full object-contain" src={item.data.imageUrl} alt={t("inbox.viewOriginal")} /></button>
      <WorkspaceDialog open={viewing} onClose={() => setViewing(false)} title={item.data.fileName} closeLabel={t("common.close")}>
        <img className="max-h-[75dvh] w-full object-contain" src={item.data.imageUrl} alt={t("inbox.viewOriginal")} />
      </WorkspaceDialog></>}
    {editing ? <form onSubmit={event => { event.preventDefault(); void save(); }} className="mt-3 space-y-3"><fieldset disabled={busy} className="space-y-3">
      {item.type !== "screenshot" && <label className="block text-sm">{t("capture.content")}<textarea required maxLength={20000} className="workspace-textarea min-h-28" value={draft.text} onChange={e => patch({ text: e.target.value })} /></label>}
      {item.type !== "quick_note" && <label className="block text-sm">{t("capture.annotation")}<textarea className="workspace-textarea min-h-16" maxLength={10000} value={draft.comment} onChange={e => patch({ comment: e.target.value })} /></label>}
      {item.type === "screenshot" && <><label className="block text-sm">{t("capture.page")}<input className="workspace-input" value={draft.page} onChange={e => patch({ page: e.target.value })} /></label><label className="block text-sm">{t("capture.location")}<input className="workspace-input" value={draft.location} onChange={e => patch({ location: e.target.value })} /></label></>}
      <EntityPicker kind="sources" label={t("workflow.source")} value={draft.sourceId} onChange={sourceId => patch({ sourceId })} /><EntityPicker kind="notes" label={t("workflow.note")} value={draft.noteId} onChange={noteId => patch({ noteId })} />
      <div className="flex gap-2"><Button type="submit" aria-busy={busy}>{busy ? t("inbox.saving") : t("workflow.saveChanges")}</Button><Button type="button" variant="ghost" onClick={() => { setDraft(readDraft()); setEditing(false); setError(null); requestAnimationFrame(() => editTrigger.current?.focus()); }}>{t("inbox.cancel")}</Button></div>
    </fieldset></form> : <>
      {item.type !== "screenshot" && <p className="my-3 whitespace-pre-wrap break-words text-sm leading-7">{item.type === "highlight" ? item.data.text : item.data.content}</p>}
      {item.type === "highlight" && item.data.personalComment && <p className="my-3 whitespace-pre-wrap text-sm text-[var(--ink-muted)]">{item.data.personalComment}</p>}
      {item.type === "screenshot" && <><p className="text-xs text-[var(--ink-muted)]">{[item.data.page, item.data.location].filter(Boolean).join(" · ")}</p><p className="my-3 whitespace-pre-wrap text-sm">{item.data.annotation}</p></>}
      <div className="flex flex-wrap gap-3 text-xs">{data.sourceId && <Link className="inline-flex min-h-11 items-center underline" href={withReturnTo(`/library/${data.sourceId}`, currentUrl)}>{data.sourceTitle ?? t("workflow.source")}</Link>}{data.noteId && <Link className="inline-flex min-h-11 items-center underline" href={withReturnTo(`/notes/${data.noteId}`, currentUrl)}>{data.noteTitle ?? t("workflow.note")}</Link>}</div>
      <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-[var(--line)] pt-2"><Button ref={editTrigger} disabled={busy} variant="ghost" onClick={() => { setDraft(readDraft()); setEditing(true); }}>{t("inbox.edit")}</Button><Button disabled={busy} aria-busy={busy} variant="secondary" onClick={() => void mutate("PATCH", { status: view === "inbox" ? "processed" : "inbox" })}>{view === "inbox" ? t("workflow.processed") : t("workflow.restore")}</Button>{view !== "archived" && <Button disabled={busy} variant="ghost" onClick={() => void mutate("DELETE")}>{t("inbox.archive")}</Button>}</div>
    </>}{error && <p role="alert" className="mt-2 text-sm text-[var(--danger)]">{error}</p>}
  </li>;
}

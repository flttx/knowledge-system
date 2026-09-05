"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { EntityPicker } from "@/components/ui/entity-picker";
import { notifyWorkflow } from "@/components/ui/workflow";
import { useDialogFocusTrap } from "@/lib/hooks/use-dialog-focus-trap";
import { requestJson } from "@/lib/api/client";
import { invalidateQueryCache } from "@/lib/hooks/use-swr-query";
import { clearListSnapshots } from "@/lib/hooks/use-list-query";
import { highlightPayload, inboxItemHref, validCaptureImage } from "@/lib/workflow";

type Kind = "quick_note" | "highlight" | "screenshot";
const empty = () => ({ content: "", comment: "", sourceId: "", page: "", location: "", image: null as File | null });
export function CaptureForm({ modal = false, open = true, onClose, sourceId: contextSource }: { modal?: boolean; open?: boolean; onClose?: () => void; sourceId?: string }) {
  const { t } = useI18n(); const router = useRouter(); const id = useId();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [kind, setKind] = useState<Kind>("quick_note");
  const [drafts, setDrafts] = useState({ quick_note: empty(), highlight: empty(), screenshot: empty() });
  const draft = drafts[kind];
  const [direct, setDirect] = useState(false);
  const [busy, setBusy] = useState(false); const busyRef = useRef(false);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const dialog = useRef<HTMLDivElement>(null); const content = useRef<HTMLTextAreaElement>(null); const fileInput = useRef<HTMLInputElement>(null);
  const close = () => { if (!busyRef.current) onClose?.(); };
  useDialogFocusTrap({ dialogRef: dialog, initialFocusRef: content, onEscape: close, open: modal && open });
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => content.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, kind]);
  useEffect(() => {
    if (!draft.image) return;
    const url = URL.createObjectURL(draft.image);
    const timer = window.setTimeout(() => setPreview(url), 0);
    return () => { window.clearTimeout(timer); URL.revokeObjectURL(url); };
  }, [draft.image]);
  const dirty = Object.values(drafts).some(d => d.content || d.comment || d.image || d.page || d.location);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  function patch(values: Partial<typeof draft>) { setDrafts(prev => ({ ...prev, [kind]: { ...prev[kind], ...values } })); }
  function selectImage(file?: File) {
    if (!file || busyRef.current) return;
    if (!validCaptureImage(file)) { setError({ field: "image", message: t("capture.screenshotInvalid") }); return; }
    setDrafts(prev => ({ ...prev, screenshot: { ...prev.screenshot, image: file } })); setKind("screenshot"); setError(null);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busyRef.current) return;
    if (kind !== "screenshot" && !draft.content.trim()) { setError({ field: "content", message: t("capture.content") }); content.current?.focus(); return; }
    if (kind === "screenshot" && !draft.image) { setError({ field: "image", message: t("capture.screenshotRequired") }); fileInput.current?.focus(); return; }
    busyRef.current = true; setBusy(true); setError(null);
    const sourceId = draft.sourceId || contextSource || undefined;
    try {
      let result: { id: string };
      if (kind === "screenshot") {
        const body = new FormData(); body.append("image", draft.image!);
        if (sourceId) body.append("sourceId", sourceId);
        if (draft.comment.trim()) body.append("annotation", draft.comment.trim());
        if (draft.page.trim()) body.append("page", draft.page.trim());
        if (draft.location.trim()) body.append("location", draft.location.trim());
        result = await requestJson("/api/screenshots", { method: "POST", body });
      } else {
        const payload = kind === "highlight" ? { ...highlightPayload(draft.content, draft.comment, sourceId), ...(draft.page ? { page: Number(draft.page) } : {}), location: draft.location || undefined }
          : direct ? { title: draft.content.trim().split("\n")[0].replace(/^[#\s]+/, "").slice(0, 40) || t("notes.new"), contentMarkdown: draft.content }
          : { content: draft.content.trim(), sourceId };
        result = await requestJson(kind === "highlight" ? "/api/highlights" : direct ? "/api/notes" : "/api/quick-notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      }
      setDrafts(prev => ({ ...prev, [kind]: { ...empty(), sourceId: draft.sourceId } }));
      if (fileInput.current) fileInput.current.value = "";
      setPreview(null); invalidateQueryCache(); clearListSnapshots();
      const isNote = kind === "quick_note" && direct;
      const href = isNote ? `/notes/${result.id}` : inboxItemHref(kind, result.id);
      notifyWorkflow(isNote ? t("workflow.noteCreated") : t("capture.saved"), href);
      setDirect(false);
      if (modal) onClose?.();
      if (isNote) router.push(href); else { router.refresh(); if (!modal) content.current?.focus(); }
    } catch (err) { setError({ field: "submit", message: err instanceof Error ? err.message : t("capture.saveFailed") }); }
    finally { busyRef.current = false; setBusy(false); }
  }
  const fields = <form className="space-y-4" onSubmit={e => void submit(e)} onPaste={e => { const file = Array.from(e.clipboardData.files).find(f => f.type.startsWith("image/")); if (file) { e.preventDefault(); selectImage(file); } }}>
    <fieldset disabled={busy} className="space-y-4">
      <legend className="sr-only">{t("capture.type")}</legend>
      <div className="flex gap-1 rounded-lg bg-[var(--surface-muted)] p-1">{(["quick_note", "highlight", "screenshot"] as const).map(value => <Button type="button" key={value} variant={value === kind ? "primary" : "ghost"} className="flex-1" aria-pressed={value === kind} onClick={() => { setKind(value); setError(null); }}>{t(value === "quick_note" ? "capture.quickNote" : value === "highlight" ? "capture.highlight" : "capture.screenshot")}</Button>)}</div>
      {kind === "screenshot" ? <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); selectImage(e.dataTransfer.files[0]); }}>
        <label htmlFor={`${id}-image`} className="block text-sm">{t("workflow.chooseImage")}</label><input id={`${id}-image`} ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={e => selectImage(e.target.files?.[0])} className="my-2 max-w-full" aria-describedby={`${id}-image-help`} />
        <p id={`${id}-image-help`} className="text-xs text-[var(--ink-muted)]">{t("workflow.imageLimit")}</p>
        {draft.image && preview && <div className="mt-2"><img src={preview} alt={t("inbox.viewOriginal")} className="max-h-56 max-w-full object-contain" /><Button type="button" variant="ghost" onClick={() => { patch({ image: null }); if (fileInput.current) fileInput.current.value = ""; }}>{t("capture.clear")}</Button></div>}
        {error?.field === "image" && <p role="alert">{error.message}</p>}
      </div> : <div><label htmlFor={`${id}-content`} className="block text-sm">{t("capture.content")}</label><textarea id={`${id}-content`} ref={content} value={draft.content} onChange={e => patch({ content: e.target.value })} className="workspace-textarea mt-2 min-h-36" maxLength={20000} aria-invalid={error?.field === "content"} />{error?.field === "content" && <p role="alert">{error.message}</p>}</div>}
      {kind !== "quick_note" && <div><label htmlFor={`${id}-comment`} className="text-sm">{t("capture.annotation")}</label><textarea id={`${id}-comment`} className="workspace-textarea min-h-16" value={draft.comment} maxLength={10000} onChange={e => patch({ comment: e.target.value })} /></div>}
      <details><summary className="flex min-h-11 cursor-pointer items-center text-sm">{t("workflow.details")}</summary><div className="space-y-3 py-2"><EntityPicker kind="sources" label={t("capture.source")} value={draft.sourceId || contextSource || ""} onChange={sourceId => patch({ sourceId })} />{kind !== "quick_note" && <><label className="block text-xs">{t("capture.page")}<input className="workspace-input" type={kind === "highlight" ? "number" : "text"} min={1} step={1} value={draft.page} onChange={e => patch({ page: e.target.value })} /></label><label className="block text-xs">{t("capture.location")}<input className="workspace-input" value={draft.location} maxLength={500} onChange={e => patch({ location: e.target.value })} /></label></>}</div></details>
      {kind === "quick_note" && <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={direct} onChange={e => setDirect(e.target.checked)} />{t("workflow.directNote")}</label>}
    </fieldset>
    {error?.field === "submit" && <p role="alert" className="text-sm text-[var(--danger)]">{error.message}</p>}
    <div className="flex justify-end gap-2 border-t border-[var(--line)] pt-3">{modal && <Button type="button" variant="ghost" disabled={busy} onClick={close}>{t("inbox.cancel")}</Button>}<Button type="submit" disabled={busy} aria-busy={busy}>{busy ? t("inbox.saving") : kind === "quick_note" && direct ? t("workflow.directNote") : t("capture.save")}</Button></div>
  </form>;
  if (!modal) return fields;
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(<div hidden={!open} className={open ? "fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-2 sm:items-center sm:p-4" : "hidden"} onMouseDown={e => { if (e.target === e.currentTarget) close(); }}><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} tabIndex={-1} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl bg-[var(--surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"><div className="mb-4 flex items-center justify-between"><h2 id={`${id}-title`} className="font-semibold">{t("nav.capture")}</h2><Button variant="ghost" disabled={busy} onClick={close} aria-label={t("common.close")}>×</Button></div>{fields}</div></div>, document.body);
}

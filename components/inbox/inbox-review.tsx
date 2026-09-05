"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { MaterialRow, SuggestionRow, type InboxItem, type InboxView } from "./inbox-manager";
import { Button } from "@/components/ui/button";
import { CaptureButton, ReturnLink } from "@/components/ui/workflow";
import { EmptyState, PageContainer, PageHeader } from "@/components/ui/workspace";
import { SkeletonInboxList } from "@/components/ui/skeleton";
import { useListParams, usePagedList } from "@/lib/hooks/use-list-query";
import { requestJson } from "@/lib/api/client";

export function InboxReview() {
  const { t } = useI18n(); const { params, update } = useListParams();
  const view: InboxView = params.get("status") === "processed" ? "processed" : params.get("status") === "archived" ? "archived" : "inbox";
  const list = usePagedList<InboxItem>(`/api/inbox?limit=30&status=${view}`);
  const itemId = params.get("itemId"); const itemType = params.get("itemType");
  const [target, setTarget] = useState<InboxItem | null>(null); const [targetError, setTargetError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    const endpoint = itemType === "highlight" ? "highlights" : itemType === "screenshot" ? "screenshots" : itemType === "quick_note" ? "quick-notes" : null;
    const timer = window.setTimeout(() => {
      setTarget(null); setTargetError(false);
      if (!endpoint) { setTargetError(true); return; }
      void requestJson<InboxItem["data"]>(`/api/${endpoint}/${encodeURIComponent(itemId)}`, { signal: controller.signal }).then(data => {
        if (controller.signal.aborted) return;
        const item = { id: itemId, type: itemType, data } as InboxItem;
        setTarget(item);
        if (["inbox", "processed", "archived"].includes(data.status)) update({ status: data.status });
        requestAnimationFrame(() => { const row = listRef.current?.querySelector<HTMLElement>("[data-target] [data-inbox-key]"); row?.focus(); row?.scrollIntoView({ block: "center" }); });
      }).catch(() => { if (!controller.signal.aborted) setTargetError(true); });
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [itemId, itemType, update]);
  const rows = list.items.filter(item => !(target && item.id === target.id && item.type === target.type));
  async function changed(item: InboxItem) {
    const keys = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-inbox-key]") ?? [])].map(row => row.dataset.inboxKey);
    const nextKey = keys[keys.indexOf(`${item.type}:${item.id}`) + 1];
    if (target?.id === item.id && target.type === item.type) { setTarget(null); update({ itemId: "", itemType: "" }); }
    await list.reload();
    requestAnimationFrame(() => {
      const next = [...(listRef.current?.querySelectorAll<HTMLElement>("[data-inbox-key]") ?? [])].find(row => row.dataset.inboxKey === nextKey);
      (next ?? heading.current)?.focus();
    });
  }
  function row(item: InboxItem) { return item.type === "ai_suggestion" ? <SuggestionRow key={`${item.type}:${item.id}`} item={item.data} onChanged={() => void changed(item)} /> : <MaterialRow key={`${item.type}:${item.id}`} item={item} view={view} onChanged={() => void changed(item)} />; }
  return <PageContainer width="list"><PageHeader><div><h1 ref={heading} tabIndex={-1} className="workspace-page-title">{t("layout.inboxTitle")}</h1><p className="workspace-page-description">{t("layout.inboxDescription")}</p></div><CaptureButton /></PageHeader>
    {params.get("returnTo") && <ReturnLink fallback="/search" />}
    <div className="my-4 flex flex-wrap items-center gap-2" aria-label={t("nav.inbox")}>{(["inbox", "processed", "archived"] as const).map(status => <Button key={status} aria-pressed={view === status} variant={view === status ? "primary" : "secondary"} onClick={() => { setTarget(null); update({ status, itemId: "", itemType: "" }); }}>{t(`workflow.${status}`)}</Button>)}<span className="text-xs text-[var(--ink-muted)]">{t("workflow.loaded", { count: list.items.length })}</span></div>
    {targetError && <p role="alert">{t("workflow.missing")}</p>}
    {list.error && <div role="alert">{list.error}<Button onClick={() => void list.reload()}>{t("common.retry")}</Button></div>}
    {list.loading && !list.items.length && <SkeletonInboxList count={4} />}
    <ul ref={listRef} className="space-y-4">{target && <li data-target className="rounded-xl ring-2 ring-[var(--accent)]"><ul>{row(target)}</ul></li>}{rows.map(row)}</ul>
    {!list.loading && !list.error && !list.items.length && !target && <EmptyState title={t(`workflow.${view}`)} description={t(`workflow.empty.${view}`)} action={view === "inbox" ? <CaptureButton /> : undefined} />}
    {list.nextCursor && <Button className="mt-5" disabled={list.loading} onClick={() => void list.loadMore()}>{list.loading ? t("common.loading") : t("workflow.more")}</Button>}
  </PageContainer>;
}

"use client";
import { useId, useState } from "react";
import { usePagedList } from "@/lib/hooks/use-list-query";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "./button";

export function EntityPicker({ kind, value, label, onChange }: { kind: "sources" | "notes"; value: string; label: string; onChange: (id: string) => void }) {
  const { t } = useI18n(); const id = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  return <div><label htmlFor={id} className="block text-xs font-semibold">{label}</label><div className="flex gap-2"><input id={id} className="workspace-input" value={open ? query : value ? selected || t("workflow.selected") : ""} placeholder={t("workflow.find")} onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }} /><Button type="button" variant="ghost" onClick={() => { onChange(""); setSelected(""); setQuery(""); setOpen(false); }}>{t("capture.clear")}</Button></div>{open && <EntityOptions kind={kind} query={query} onSelect={(id, title) => { onChange(id); setSelected(title); setOpen(false); }} onClose={() => setOpen(false)} />}</div>;
}
function EntityOptions({ kind, query, onSelect, onClose }: { kind: "sources" | "notes"; query: string; onSelect: (id: string, title: string) => void; onClose: () => void }) {
  const { t } = useI18n();
  const list = usePagedList<{ id: string; title: string }>(`/api/${kind}?limit=20&q=${encodeURIComponent(query)}`, false);
  return <div className="my-2 max-h-64 overflow-auto rounded-md border border-[var(--line)] p-2" onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}>
    {list.items.map(item => <button key={item.id} type="button" className="block min-h-11 w-full rounded px-2 text-left hover:bg-[var(--surface-muted)]" onClick={() => onSelect(item.id, item.title)}>{item.title}</button>)}
    {list.loading && <p role="status">{t("common.loading")}</p>}{list.error && <p role="alert">{list.error}<Button type="button" onClick={() => void list.reload()}>{t("common.retry")}</Button></p>}
    {!list.loading && !list.items.length && !list.error && <p>{t("workflow.noMatches")}</p>}
    {list.nextCursor && <Button type="button" disabled={list.loading} onClick={() => void list.loadMore()}>{t("workflow.more")}</Button>}
    <Button type="button" variant="ghost" onClick={onClose}>{t("common.close")}</Button>
  </div>;
}

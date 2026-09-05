"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { useListParams } from "@/lib/hooks/use-list-query";
import { safeReturnTo } from "@/lib/workflow";
import { Button } from "./button";

export function ReturnLink({ fallback }: { fallback: string }) {
  const { params } = useListParams(); const { t } = useI18n();
  const href = safeReturnTo(params.get("returnTo"), fallback);
  return <Link className="inline-flex min-h-11 items-center text-sm text-[var(--ink-muted)]" href={href}>{href.startsWith("/search") ? t("workflow.backSearch") : t("workflow.back")} ←</Link>;
}
export function CaptureButton({ sourceId }: { sourceId?: string }) {
  const { t } = useI18n();
  return <Button onClick={() => window.dispatchEvent(new CustomEvent("knowledge:open-quick-capture", { detail: { sourceId } }))}>{t("nav.capture")}</Button>;
}
export function WorkflowFeedback() {
  const { t } = useI18n();
  const [notice, setNotice] = useState<{ message: string; href?: string } | null>(null);
  useEffect(() => {
    const receive = (event: Event) => setNotice((event as CustomEvent).detail);
    window.addEventListener("knowledge:feedback", receive);
    return () => window.removeEventListener("knowledge:feedback", receive);
  }, []);
  if (!notice) return null;
  return <div className="fixed bottom-20 right-3 z-50 flex max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 shadow-lg lg:bottom-5"><span role="status">{notice.message}</span>{notice.href && <Link className="inline-flex min-h-11 items-center underline" href={notice.href}>{t("workflow.view")}</Link>}<Button variant="ghost" onClick={() => setNotice(null)} aria-label={t("common.close")}>×</Button></div>;
}
export function notifyWorkflow(message: string, href?: string) { window.dispatchEvent(new CustomEvent("knowledge:feedback", { detail: { message, href } })); }

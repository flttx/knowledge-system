"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { HighlightRow, QuickNoteRow, type InboxItem } from "@/components/inbox/inbox-manager";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/ui/workspace";

interface ApiErrorPayload {
  error?: { message?: string };
}

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? "请求失败，请稍后重试。");
  }
  return body as T;
}

export function InboxReview() {
  const { t } = useI18n();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestJson<{ items: InboxItem[] }>("/api/inbox?limit=100");
      setItems(result.items);
    } catch (loadError: unknown) {
      setError(loadError instanceof Error ? loadError.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return (
    <PageContainer width="list">
      <PageHeader>
        <div>
          <p className="workspace-eyebrow">{t("inbox.eyebrow")}</p>
          <h1 className="workspace-page-title">{t("layout.inboxTitle")}</h1>
          <p className="workspace-page-description">{t("layout.inboxDescription")}</p>
        </div>
        <Link className="workspace-primary-action" href="/capture">{t("layout.inboxCapture")}</Link>
      </PageHeader>

      <div className="mt-6 flex items-center justify-between gap-4 border-y border-[var(--line)] py-3">
        <span className="text-sm text-[var(--ink-muted)]">{t("inbox.pending", { count: items.length })}</span>
        <span className="text-xs text-[var(--ink-faint)]">{t("layout.inboxReviewHint")}</span>
      </div>

      {error ? <div className="mt-6 rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert"><p>{error}</p><Button className="mt-3" variant="secondary" onClick={() => void load()}>{t("common.retry")}</Button></div> : null}
      {loading ? <div className="mt-6 border-y border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]" aria-live="polite">{t("inbox.loading")}</div> : null}
      {!loading && !error && items.length === 0 ? <div className="mt-6 workspace-empty">{t("inbox.empty")}</div> : null}
      {!loading && !error && items.length > 0 ? <ul className="workspace-surface mt-6">{items.map((item) => item.type === "highlight" ? <HighlightRow key={item.id} item={item.data} onChanged={() => void load()} /> : <QuickNoteRow key={item.id} item={item.data} onChanged={() => void load()} />)}</ul> : null}
    </PageContainer>
  );
}

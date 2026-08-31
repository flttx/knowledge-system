"use client";

import Link from "next/link";
import { useCallback } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { HighlightRow, QuickNoteRow, ScreenshotRow, type InboxItem } from "@/components/inbox/inbox-manager";
import { MotionList } from "@/components/motion/MotionList";
import { Button } from "@/components/ui/button";
import { EmptyState, PageContainer, PageHeader } from "@/components/ui/workspace";
import { SkeletonInboxList } from "@/components/ui/skeleton";
import { useSwrQuery } from "@/lib/hooks/use-swr-query";

export function InboxReview() {
  const { t } = useI18n();
  const { data, loading, error, refetch } = useSwrQuery<{ items: InboxItem[] }>("/api/inbox?limit=100");
  const items = data?.items ?? [];

  const load = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  return (
    <PageContainer width="list">
      <PageHeader className="items-center">
        <div>
          <p className="workspace-eyebrow">{t("inbox.eyebrow")}</p>
          <h1 className="workspace-page-title">{t("layout.inboxTitle")}</h1>
          <p className="workspace-page-description">{t("layout.inboxDescription")}</p>
        </div>
        <Link className="workspace-primary-action" href="/capture">{t("layout.inboxCapture")}</Link>
      </PageHeader>

      <div className="mt-6 flex items-center justify-between gap-4 rounded-lg bg-[var(--surface)] border border-[var(--line)] py-2.5 px-4 shadow-[var(--shadow-subtle)]">
        <span className="text-xs font-semibold text-[var(--ink)]">{t("inbox.pending", { count: items.length })}</span>
        <span className="text-xs text-[var(--ink-muted)]">{t("layout.inboxReviewHint")}</span>
      </div>

      {error ? <div className="mt-5 rounded-lg border border-[var(--danger-soft)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]" role="alert"><p>{error}</p><Button className="mt-3" size="sm" variant="secondary" onClick={() => void load()}>{t("common.retry")}</Button></div> : null}
      {loading ? (
        <SkeletonInboxList count={4} />
      ) : null}
      {!loading && !error && items.length === 0 ? (
        <EmptyState
          className="mt-6"
          title={t("inbox.empty")}
          description="收件箱已全部处理完成！通过快速捕捉添加新的高亮或速记。"
          action={
            <Link className="workspace-primary-action" href="/capture">
              {t("layout.inboxCapture")}
            </Link>
          }
        />
      ) : null}
      {!loading && !error && items.length > 0 ? (
        <MotionList className="mt-6 space-y-4" triggerKey={loading ? "loading" : "loaded"}>
          {items.map((item) =>
            item.type === "highlight" ? (
              <HighlightRow key={item.id} item={item.data} onChanged={() => void load()} />
            ) : item.type === "screenshot" ? (
              <ScreenshotRow key={item.id} item={item.data} onChanged={() => void load()} />
            ) : (
              <QuickNoteRow key={item.id} item={item.data} onChanged={() => void load()} />
            ),
          )}
        </MotionList>
      ) : null}
    </PageContainer>
  );
}

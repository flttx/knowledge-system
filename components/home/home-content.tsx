"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader } from "@/components/ui/workspace";
import { GraphIcon, InboxIcon, NoteIcon } from "@/components/icons";

export function HomeContent() {
  const { t } = useI18n();

  return (
    <PageContainer width="list">
      {/* Dashboard Top Header */}
      <PageHeader className="items-center justify-between pb-6 border-b border-[var(--line)]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--ink-muted)] mb-2 shadow-2xs">
            <span className="size-1.5 rounded-full bg-[var(--accent)]" />
            <span>私密书斋已就绪</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[var(--ink)]">
            {t("layout.homeTitle")}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-[var(--ink-muted)] max-w-2xl">
            {t("layout.homeDescription")}
          </p>
        </div>

        <div className="workspace-header-actions">
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md bg-[var(--ink)] px-4 text-xs font-semibold text-[var(--surface)] shadow-xs hover:bg-[var(--ink-soft)] transition-all hover:scale-[1.02]"
            href="/capture"
          >
            + {t("home.capture")}
          </Link>
          <Link
            className="inline-flex h-9 items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 text-xs font-medium text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors shadow-2xs"
            href="/inbox"
          >
            {t("home.inbox")}
          </Link>
        </div>
      </PageHeader>

      {/* 3 Quick Action / Stat Metric Pillars */}
      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Link
          href="/notes"
          className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--ink)] group-hover:scale-105 transition-transform">
              <NoteIcon size={18} />
            </span>
            <div>
              <p className="text-xs text-[var(--ink-faint)]">永久笔记</p>
              <p className="text-sm font-bold text-[var(--ink)]">双向连接库</p>
            </div>
          </div>
          <span className="text-xs text-[var(--accent)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>

        <Link
          href="/inbox"
          className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)] group-hover:scale-105 transition-transform">
              <InboxIcon size={18} />
            </span>
            <div>
              <p className="text-xs text-[var(--ink-faint)]">待办收件箱</p>
              <p className="text-sm font-bold text-[var(--ink)]">灵感与提案</p>
            </div>
          </div>
          <span className="text-xs text-[var(--accent)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>

        <Link
          href="/graph"
          className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--line-strong)] hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--surface-muted)] text-[var(--ink-soft)] group-hover:scale-105 transition-transform">
              <GraphIcon size={18} />
            </span>
            <div>
              <p className="text-xs text-[var(--ink-faint)]">全局网络</p>
              <p className="text-sm font-bold text-[var(--ink)]">知识图谱视窗</p>
            </div>
          </div>
          <span className="text-xs text-[var(--accent)] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
        </Link>
      </div>

      {/* Main Sections Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {/* Inbox Section */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <InboxIcon size={15} />
                </span>
                <h2 className="text-base font-semibold text-[var(--ink)]">{t("home.inboxTitle")}</h2>
              </div>
              <Link className="text-xs font-semibold text-[var(--accent-strong)] hover:underline" href="/inbox">
                {t("home.inbox")} &rarr;
              </Link>
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-6 text-[var(--ink-muted)]">
              {t("home.inboxDescription")}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <span className="text-xs text-[var(--ink-faint)]">从外部捕获的高亮与速记</span>
            <Link className="inline-flex items-center justify-center h-8 rounded-lg bg-[var(--surface-muted)] px-3 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] transition-colors" href="/inbox">
              处理待办灵感 &rarr;
            </Link>
          </div>
        </div>

        {/* Notes Section */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-md bg-[var(--success-soft)] text-[var(--success)]">
                  <NoteIcon size={15} />
                </span>
                <h2 className="text-base font-semibold text-[var(--ink)]">{t("home.notesTitle")}</h2>
              </div>
              <Link className="text-xs font-semibold text-[var(--accent-strong)] hover:underline" href="/notes">
                {t("home.openNotes")} &rarr;
              </Link>
            </div>
            <p className="mt-3 text-xs sm:text-sm leading-6 text-[var(--ink-muted)]">
              {t("home.notesDescription")}
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--line)] flex items-center justify-between">
            <span className="text-xs text-[var(--ink-faint)]">基于 [[Wikilinks]] 的持久笔记</span>
            <Link className="inline-flex items-center justify-center h-8 rounded-lg bg-[var(--surface-muted)] px-3 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-strong)] transition-colors" href="/notes">
              浏览所有笔记 &rarr;
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

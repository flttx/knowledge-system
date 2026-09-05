"use client";

import Link from "next/link";

import {
  ArrowUpRightIcon,
  CaptureIcon,
  InboxIcon,
  NoteIcon,
} from "@/components/icons";
import { MarkdownPreview } from "@/components/editor/markdown-preview";
import type { InboxItem } from "@/components/inbox/inbox-types";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { CaptureButton } from "@/components/ui/workflow";
import { EmptyState, PageContainer } from "@/components/ui/workspace";
import { useSwrQuery } from "@/lib/hooks/use-swr-query";
import { inboxItemHref, withReturnTo } from "@/lib/workflow";

interface HomeNote {
  id: string;
  title: string;
  excerpt: string;
  previewMarkdown: string;
}

function inboxPreview(item: InboxItem): string {
  switch (item.type) {
    case "highlight":
      return item.data.text;
    case "quick_note":
      return item.data.content;
    case "screenshot":
      return item.data.annotation || item.data.fileName;
    case "ai_suggestion":
      return item.data.payload.type === "relation"
        ? item.data.payload.reason
        : item.data.payload.proposedTitle;
  }
}

function inboxTypeLabel(
  item: InboxItem,
  t: (key: "capture.highlight" | "capture.quickNote" | "capture.screenshot" | "workflow.suggestion") => string,
): string {
  switch (item.type) {
    case "highlight":
      return t("capture.highlight");
    case "quick_note":
      return t("capture.quickNote");
    case "screenshot":
      return t("capture.screenshot");
    case "ai_suggestion":
      return t("workflow.suggestion");
  }
}

function LoadingRows({ count = 3, label }: { count?: number; label: string }) {
  return (
    <div aria-label={label} className="space-y-4" role="status">
      {Array.from({ length: count }, (_, index) => (
        <div className="animate-pulse border-t border-[var(--line)] pt-4" key={index}>
          <div className="h-3 w-24 rounded bg-[var(--surface-muted)]" />
          <div className="mt-3 h-5 w-4/5 rounded bg-[var(--surface-muted)]" />
          <div className="mt-2 h-3 w-full rounded bg-[var(--surface-muted)]" />
        </div>
      ))}
    </div>
  );
}

function InlineError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--danger)]/30 pt-4 text-sm" role="alert">
      <span className="text-[var(--danger)]">{message}</span>
      <Button onClick={onRetry} size="sm" variant="secondary">{t("common.retry")}</Button>
    </div>
  );
}

export function HomeContent() {
  const { t } = useI18n();
  const notes = useSwrQuery<{ items: HomeNote[] }>("/api/notes?limit=5");
  const inbox = useSwrQuery<{ items: InboxItem[] }>("/api/inbox?limit=5&status=inbox");
  const noteItems = notes.data?.items ?? [];
  const inboxItems = inbox.data?.items ?? [];
  const featuredNote = noteItems[0];

  return (
    <PageContainer className="pb-2" width="list">
      <section className="relative border-b border-[var(--line-strong)] pb-8 sm:pb-10" aria-labelledby="home-title">
        <div className="max-w-3xl">
          <p className="workspace-eyebrow flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-[var(--accent)]" />
            {t("home.eyebrow")}
          </p>
          <div className="mt-3 flex flex-col gap-6 sm:mt-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 id="home-title" className="text-[clamp(2.25rem,7vw,4.5rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[var(--ink)]">
                {t("home.title")}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-[var(--ink-muted)] sm:text-lg">
                {t("home.description")}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <CaptureButton />
              <Link className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 text-sm font-medium text-[var(--ink)] transition-colors hover:bg-[var(--surface-muted)]" href="/inbox">
                {t("home.inbox")}
                <ArrowUpRightIcon size={15} />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center gap-3 text-xs text-[var(--ink-faint)]">
          <span className="h-px w-8 bg-[var(--accent)]" />
          <span>{t("auth.privateSpace")}</span>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)] lg:gap-12">
        <section aria-labelledby="recent-notes-title">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="workspace-eyebrow">01</p>
              <h2 id="recent-notes-title" className="mt-1 text-xl font-semibold tracking-[-0.025em]">{t("home.notesTitle")}</h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">{t("home.notesDescription")}</p>
            </div>
            <Link className="inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-medium text-[var(--accent-strong)] underline decoration-[var(--accent)]/40 underline-offset-4 hover:decoration-[var(--accent-strong)]" href="/notes">
              {t("home.openNotes")}
              <ArrowUpRightIcon size={14} />
            </Link>
          </div>

          <div className="mt-6">
            {notes.loading ? <LoadingRows count={2} label={t("common.loading")} /> : null}
            {notes.error ? <InlineError message={notes.error} onRetry={() => void notes.refetch()} /> : null}
            {!notes.loading && !notes.error && featuredNote ? (
              <div className="border-y border-[var(--line)]">
                <div className="border-l-2 border-[var(--accent)] px-5 py-6 transition-colors hover:bg-[var(--surface-muted)]/60 sm:px-7 sm:py-8">
                  <span className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--accent-strong)]">{t("workflow.recentNotes")}</span>
                  <Link className="group block max-w-2xl" href={withReturnTo(`/notes/${featuredNote.id}`, "/home")}>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight tracking-[-0.035em] text-[var(--ink)] group-hover:text-[var(--accent-strong)] sm:text-3xl">{featuredNote.title}</h3>
                  </Link>
                  <MarkdownPreview
                    markdown={featuredNote.previewMarkdown || featuredNote.excerpt}
                    className="markdown-preview--compact mt-3 max-w-2xl text-sm sm:text-base"
                  />
                  <Link className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--ink-soft)] hover:text-[var(--accent-strong)]" href={withReturnTo(`/notes/${featuredNote.id}`, "/home")}>
                    {t("workflow.openNote")}
                    <ArrowUpRightIcon size={15} />
                  </Link>
                </div>
                {noteItems.slice(1).map((note) => (
                  <div className="group border-t border-[var(--line)] px-5 py-4 transition-colors hover:bg-[var(--surface-muted)]/60 sm:px-7" key={note.id}>
                    <Link className="flex items-center justify-between gap-4" href={withReturnTo(`/notes/${note.id}`, "/home")}>
                      <span className="min-w-0 truncate font-medium text-[var(--ink)] group-hover:text-[var(--accent-strong)]">{note.title}</span>
                      <ArrowUpRightIcon className="shrink-0 text-[var(--ink-faint)] group-hover:text-[var(--accent-strong)]" size={16} />
                    </Link>
                    <MarkdownPreview
                      markdown={note.previewMarkdown || note.excerpt}
                      className="markdown-preview--compact mt-1 max-w-3xl text-sm"
                    />
                  </div>
                ))}
              </div>
            ) : null}
            {!notes.loading && !notes.error && noteItems.length === 0 ? (
              <EmptyState className="mt-4" icon={<NoteIcon size={22} />} title={t("workflow.first")} description={t("workflow.recentEmpty")} action={<CaptureButton />} />
            ) : null}
          </div>
        </section>

        <aside className="self-start border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 lg:mt-9" aria-labelledby="inbox-title">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="workspace-eyebrow">02</p>
              <h2 id="inbox-title" className="mt-1 text-xl font-semibold tracking-[-0.025em]">{t("home.inboxTitle")}</h2>
            </div>
            <span className="flex size-9 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]"><InboxIcon size={18} /></span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{t("home.inboxDescription")}</p>

          <div className="mt-5">
            {inbox.loading ? <LoadingRows count={2} label={t("common.loading")} /> : null}
            {inbox.error ? <InlineError message={inbox.error} onRetry={() => void inbox.refetch()} /> : null}
            {!inbox.loading && !inbox.error && inboxItems.length > 0 ? (
              <ul className="border-t border-[var(--line)]">
                {inboxItems.map((item) => (
                  <li key={`${item.type}:${item.id}`}>
                    <Link className="group block border-b border-[var(--line)] py-4" href={withReturnTo(item.type === "ai_suggestion" ? "/inbox" : inboxItemHref(item.type, item.id), "/home")}>
                      <span className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--accent-strong)]">
                        <span>{inboxTypeLabel(item, t)}</span>
                        <ArrowUpRightIcon className="text-[var(--ink-faint)] group-hover:text-[var(--accent-strong)]" size={14} />
                      </span>
                      <span className="mt-2 block line-clamp-2 text-sm leading-5 text-[var(--ink)] group-hover:text-[var(--accent-strong)]">{inboxPreview(item)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {!inbox.loading && !inbox.error && inboxItems.length === 0 ? (
              <div className="border-t border-[var(--line)] py-6 text-sm text-[var(--ink-muted)]">{t("workflow.empty.inbox")}</div>
            ) : null}
          </div>

          <Link className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-[var(--accent-strong)] underline decoration-[var(--accent)]/40 underline-offset-4 hover:decoration-[var(--accent-strong)]" href="/inbox">
            {t("home.inbox")}
            <ArrowUpRightIcon size={14} />
          </Link>
        </aside>
      </div>

      <nav aria-label={t("shell.mainNav")} className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5 text-sm text-[var(--ink-muted)]">
        <Link className="inline-flex min-h-11 items-center gap-2 hover:text-[var(--ink)]" href="/notes"><NoteIcon size={16} />{t("nav.notes")}</Link>
        <Link className="inline-flex min-h-11 items-center gap-2 hover:text-[var(--ink)]" href="/library"><InboxIcon size={16} />{t("nav.library")}</Link>
        <Link className="inline-flex min-h-11 items-center gap-2 hover:text-[var(--ink)]" href="/capture"><CaptureIcon size={16} />{t("nav.capture")}</Link>
      </nav>
    </PageContainer>
  );
}

"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader, Section } from "@/components/ui/workspace";

export function HomeContent() {
  const { t } = useI18n();
  return (
    <PageContainer width="list">
      <PageHeader className="items-start">
        <div className="max-w-2xl">
          <p className="workspace-eyebrow">{t("home.eyebrow")}</p>
          <h1 className="workspace-page-title">{t("layout.homeTitle")}</h1>
          <p className="workspace-page-description">{t("layout.homeDescription")}</p>
        </div>
        <div className="workspace-header-actions">
          <Link className="workspace-primary-action" href="/capture">{t("home.capture")}</Link>
          <Link className="text-sm font-medium text-[var(--accent-strong)]" href="/inbox">{t("home.inbox")}</Link>
          <Link className="text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]" href="/settings/export">{t("home.export")}</Link>
        </div>
      </PageHeader>
      <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(17rem,0.8fr)]">
        <Section title={t("home.inboxTitle")} action={<Link className="text-sm font-medium text-[var(--accent-strong)]" href="/inbox">{t("home.inbox")}</Link>}>
          <Link className="block border-b border-[var(--line)] py-4 transition-colors hover:bg-[var(--surface-muted)]" href="/inbox">
            <p className="text-[15px] leading-7 text-[var(--ink-soft)]">{t("home.inboxDescription")}</p>
          </Link>
        </Section>
        <Section title={t("home.notesTitle")} action={<Link className="text-sm font-medium text-[var(--accent-strong)]" href="/notes">{t("home.openNotes")}</Link>}>
          <Link className="block border-b border-[var(--line)] py-4 transition-colors hover:bg-[var(--surface-muted)]" href="/notes">
            <p className="text-[15px] leading-7 text-[var(--ink-soft)]">{t("home.notesDescription")}</p>
          </Link>
        </Section>
      </div>
    </PageContainer>
  );
}

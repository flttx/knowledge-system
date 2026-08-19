"use client";

import Link from "next/link";

import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader } from "@/components/ui/workspace";

export function SettingsPage() {
  const { t } = useI18n();
  const items = [
    { href: "/settings/local-agent", title: t("settings.localAgent"), description: t("settings.localAgentDescription") },
    { href: "/settings/export", title: t("settings.export"), description: t("settings.exportDescription") },
  ];
  return (
    <PageContainer width="detail">
      <PageHeader className="items-start"><div>
      <p className="workspace-eyebrow">{t("settings.eyebrow")}</p>
      <h1 className="workspace-page-title">{t("layout.settingsTitle")}</h1>
      <p className="workspace-page-description">{t("layout.settingsDescription")}</p>
      </div></PageHeader>
      <section className="mt-10 border-t border-[var(--line-strong)]" aria-labelledby="language-heading">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] py-5">
          <div><h2 id="language-heading" className="text-sm font-semibold">{t("settings.language")}</h2><p className="mt-1 text-sm text-[var(--ink-muted)]">{t("settings.languageDescription")}</p></div>
          <LocaleSwitcher />
        </div>
        {items.map((item) => <Link className="flex items-center justify-between gap-4 border-b border-[var(--line)] py-5 group" href={item.href} key={item.href}><span><span className="block text-sm font-semibold group-hover:text-[var(--accent-strong)]">{item.title}</span><span className="mt-1 block text-sm text-[var(--ink-muted)]">{item.description}</span></span><span className="text-sm text-[var(--ink-faint)]">{t("settings.open")} →</span></Link>)}
      </section>
    </PageContainer>
  );
}

"use client";

import Link from "next/link";

import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, PageHeader } from "@/components/ui/workspace";
import { LogOutIcon } from "@/components/icons";
import { logoutAction } from "@/lib/auth/actions";

export function SettingsPage() {
  const { t } = useI18n();
  const items = [
    { href: "/settings/local-agent", title: t("settings.localAgent"), description: t("settings.localAgentDescription") },
    { href: "/settings/export", title: t("settings.export"), description: t("settings.exportDescription") },
  ];
  return (
    <PageContainer width="detail">
      <PageHeader className="items-start">
        <div>
          <p className="workspace-eyebrow">{t("settings.eyebrow")}</p>
          <h1 className="workspace-page-title">{t("layout.settingsTitle")}</h1>
          <p className="workspace-page-description">{t("layout.settingsDescription")}</p>
        </div>
      </PageHeader>
      <section className="mt-8 workspace-surface" aria-labelledby="language-heading">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 px-5 border-b border-[var(--line)]">
          <div>
            <h2 id="language-heading" className="text-sm font-semibold text-[var(--ink)]">{t("settings.language")}</h2>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{t("settings.languageDescription")}</p>
          </div>
          <LocaleSwitcher />
        </div>
        {items.map((item) => (
          <Link className="workspace-list-row flex items-center justify-between gap-4 py-4 px-5 group" href={item.href} key={item.href}>
            <div>
              <span className="block text-sm font-semibold text-[var(--ink)] group-hover:text-[var(--accent-strong)] transition-colors">{item.title}</span>
              <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">{item.description}</span>
            </div>
            <span className="text-xs text-[var(--ink-faint)] group-hover:text-[var(--accent-strong)] transition-colors font-medium shrink-0">{t("settings.open")} &rarr;</span>
          </Link>
        ))}
        <form action={logoutAction} className="border-t border-[var(--line)]">
          <button
            type="submit"
            className="w-full flex items-center justify-between gap-4 py-4 px-5 text-left group hover:bg-[var(--danger-soft)] transition-colors cursor-pointer"
          >
            <div>
              <span className="block text-sm font-semibold text-[var(--danger)] group-hover:underline">{t("shell.logout")}</span>
              <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">结束当前设备的登录会话</span>
            </div>
            <LogOutIcon size={16} className="text-[var(--danger)] shrink-0" />
          </button>
        </form>
      </section>
    </PageContainer>
  );
}

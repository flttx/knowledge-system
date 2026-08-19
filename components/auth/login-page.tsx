"use client";

import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPageContent() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[var(--background)] px-5 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-14 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-semibold text-white">K</span>
            <span><span className="block text-sm font-semibold">Knowledge</span><span className="block text-xs text-[var(--ink-faint)]">{t("brand.tagline")}</span></span>
          </div>
          <LocaleSwitcher />
        </div>
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-[var(--ink-muted)]">Knowledge</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,2.75rem)] font-semibold tracking-[-0.04em] text-[var(--ink)]">{t("auth.welcome")}</h1>
        <p className="mt-3 max-w-sm text-[15px] leading-7 text-[var(--ink-muted)]">{t("auth.subtitle")}</p>
        <LoginForm />
        <p className="mt-10 text-xs leading-5 text-[var(--ink-faint)]">{t("auth.privateSpace")}</p>
      </div>
    </main>
  );
}

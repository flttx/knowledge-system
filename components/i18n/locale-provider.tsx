"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import {
  LOCALE_COOKIE,
  LOCALE_MAX_AGE,
  translate,
  type Locale,
  type TranslationKey,
} from "@/lib/i18n/locales";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (nextLocale) => {
      setLocaleState(nextLocale);
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; Max-Age=${LOCALE_MAX_AGE}; Path=/; SameSite=Lax`;
      document.documentElement.lang = nextLocale;
    },
    t: (key, params) => translate(locale, key, params),
  }), [locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useI18n must be used inside LocaleProvider");
  return value;
}

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className={compact ? "flex items-center gap-1" : "flex items-center gap-1.5"} aria-label={t("nav.language")}>
      {!compact ? <span className="mr-1 text-xs text-[var(--ink-faint)]">{t("nav.language")}</span> : null}
      {(["zh-CN", "en"] as const).map((option) => (
        <button
          aria-pressed={locale === option}
          className={`rounded-md px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${locale === option ? "bg-[var(--ink)] text-white" : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]"}`}
          key={option}
          onClick={() => setLocale(option)}
          type="button"
        >
          {option === "zh-CN" ? "中文" : "EN"}
        </button>
      ))}
    </div>
  );
}

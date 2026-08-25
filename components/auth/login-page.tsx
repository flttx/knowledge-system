"use client";

import Link from "next/link";
import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPageContent() {
  const { t } = useI18n();

  return (
    <main className="relative flex min-h-dvh flex-col justify-center items-center bg-[#f7f4ed] dark:bg-[#020408] px-4 py-6 sm:px-6 sm:py-10 lg:px-10 font-sans selection:bg-[#c9a85d]/30 selection:text-[#fef08a] transition-colors duration-500 overflow-y-auto">
      {/* 1. Subtle Atmospheric Background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-black/[0.02] to-black/[0.05] dark:from-[#020408] dark:via-[#050810] dark:to-[#010204] -z-10" />
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[450px] w-[550px] rounded-full bg-amber-400/[0.04] dark:bg-slate-400/[0.025] blur-[140px] -z-10" />

      {/* 2. Main Gateway Container */}
      <div className="my-auto w-full max-w-[440px] lg:max-w-[1020px] overflow-hidden rounded-2xl border border-black/[0.08] dark:border-white/[0.08] bg-white/90 dark:bg-[#050810]/75 shadow-[0_20px_60px_rgba(0,0,0,0.08)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(380px,440px)] transition-all duration-300">
        
        {/* Left Side: Restrained Brand Narrative (Desktop only or clean top header on mobile) */}
        <section
          aria-labelledby="gateway-title"
          className="hidden lg:flex relative flex-col justify-between border-r border-black/[0.08] dark:border-white/[0.08] bg-black/[0.015] dark:bg-[#03060c]/60 p-10 lg:p-12"
        >
          {/* Top Brand Mark */}
          <div className="flex items-center justify-between">
            <Link
              className="group inline-flex items-center gap-3 transition-transform hover:scale-102"
              href="/"
              aria-label="Knowledge Home"
            >
              <span className="flex size-7 items-center justify-center rounded-md border border-[#c9a85d]/60 bg-zinc-900 text-xs font-serif font-bold text-[#f3e3be] shadow-[0_0_12px_rgba(201,168,93,0.18)] select-none">
                K
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase text-zinc-800 dark:text-zinc-300">
                Knowledge
              </span>
            </Link>
          </div>

          {/* Main Brand Statement */}
          <div className="py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] dark:border-white/10 dark:bg-white/[0.03] px-3 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[#a37e2e] dark:text-[#f3e3be]/90">
              <span className="size-1 rounded-full bg-[#c9a85d] animate-pulse" />
              <span>Private Archive</span>
            </div>

            <h1
              className="mt-6 font-serif text-3xl sm:text-4xl font-normal leading-[1.14] tracking-tight text-zinc-900 dark:text-white/95"
              id="gateway-title"
            >
              {t("brand.heroLineOne")}
              <br />
              <span className="text-zinc-600 dark:text-zinc-400">{t("brand.heroLineTwo")}</span>
            </h1>

            <p className="mt-5 max-w-sm text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-light">
              {t("brand.heroDescription")}
            </p>
          </div>

          {/* Bottom Return to Home Navigation */}
          <div className="flex items-center justify-between border-t border-black/[0.06] dark:border-white/[0.06] pt-5">
            <Link
              className="group inline-flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 transition-colors hover:text-zinc-900 dark:hover:text-[#f3e3be]"
              href="/"
            >
              <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">
                &larr;
              </span>
              <span>{t("landing.backHome")}</span>
            </Link>

            <span className="text-[11px] font-mono text-zinc-500 dark:text-zinc-500">
              01 &middot; 门户收敛
            </span>
          </div>
        </section>

        {/* Right Side / Mobile Main Form Panel */}
        <section
          aria-labelledby="login-title"
          className="flex flex-col justify-between bg-[#fdfcf9] dark:bg-[#070b14]/90 p-6 sm:p-8 lg:p-10 text-zinc-900 dark:text-zinc-100"
        >
          {/* Top Panel Bar */}
          <div className="flex items-center justify-between gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-3.5">
            <div className="flex items-center gap-2.5">
              <Link
                className="flex size-7 items-center justify-center rounded-md border border-[#c9a85d]/60 bg-zinc-900 text-xs font-serif font-bold text-[#f3e3be] shadow-xs select-none lg:hidden"
                href="/"
                aria-label="Knowledge Home"
              >
                K
              </Link>
              <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {t("landing.login")} &middot; 空间通行
              </span>
            </div>

            <div className="flex items-center gap-2">
              <LocaleSwitcher compact />
              <Link
                className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors lg:hidden ml-1"
                href="/"
                aria-label={t("landing.backHome")}
              >
                &larr; {t("landing.backHome")}
              </Link>
            </div>
          </div>

          {/* Core Form Area */}
          <div className="w-full py-6 sm:py-7">
            <div className="mb-5">
              <h2
                className="font-serif text-xl sm:text-2xl font-normal tracking-tight text-zinc-900 dark:text-white"
                id="login-title"
              >
                {t("auth.welcome")}
              </h2>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 font-light">
                {t("auth.subtitle")}
              </p>
            </div>

            <LoginForm />

            <p className="mt-5 text-center text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 font-light">
              {t("auth.privateSpace")}
            </p>
          </div>

          {/* Bottom Trust Assurance */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] pt-3.5 text-center text-[11px] text-zinc-500 dark:text-zinc-400 font-light">
            {t("brand.heroTrust")}
          </div>
        </section>

      </div>
    </main>
  );
}

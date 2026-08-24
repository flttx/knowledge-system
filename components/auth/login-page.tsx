"use client";

import Link from "next/link";
import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { LoginForm } from "@/components/auth/login-form";

export function LoginPageContent() {
  const { t } = useI18n();

  return (
    <main className="relative flex min-h-dvh flex-col justify-center bg-[#020408] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 font-sans selection:bg-[#c9a85d]/30 selection:text-[#fef08a]">
      {/* 1. Subtle Obsidian & Graphite Vignette Atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#020408] via-[#050810] to-[#010204] -z-10" />
      <div className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[600px] rounded-full bg-slate-400/[0.025] blur-[150px] -z-10" />

      {/* 2. Main Gateway Container */}
      <div className="mx-auto grid w-full max-w-[1140px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#050810]/70 shadow-[0_30px_90px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:grid-cols-[minmax(0,1fr)_minmax(420px,490px)]">
        
        {/* Left Side: Restrained Brand Narrative (Deep Ink & Gold Accents) */}
        <section
          aria-labelledby="gateway-title"
          className="relative flex flex-col justify-between border-b border-white/[0.08] p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-14"
        >
          {/* Top Brand Mark */}
          <div className="flex items-center justify-between">
            <Link
              className="group inline-flex items-center gap-3 transition-transform hover:scale-102"
              href="/"
              aria-label="Knowledge Home"
            >
              <span className="flex size-7 items-center justify-center rounded-md border border-[#c9a85d]/60 bg-[#0a0e17] text-xs font-serif font-bold text-[#f3e3be] shadow-[0_0_12px_rgba(201,168,93,0.18)] select-none">
                K
              </span>
              <span className="text-xs font-semibold tracking-widest uppercase text-zinc-300">
                Knowledge
              </span>
            </Link>

            <Link
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition-colors hover:text-[#f3e3be] lg:hidden"
              href="/"
            >
              <span>&larr;</span>
              <span>{t("landing.backHome")}</span>
            </Link>
          </div>

          {/* Main Brand Statement */}
          <div className="py-10 lg:py-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-0.5 text-[10px] font-mono uppercase tracking-widest text-[#f3e3be]/90">
              <span className="size-1 rounded-full bg-[#c9a85d] animate-pulse" />
              <span>Private Archive</span>
            </div>

            <h1
              className="mt-6 font-serif text-3xl sm:text-4xl lg:text-5xl font-normal leading-[1.12] tracking-tight text-white/95"
              id="gateway-title"
            >
              {t("brand.heroLineOne")}
              <br />
              <span className="text-zinc-300">{t("brand.heroLineTwo")}</span>
            </h1>

            <p className="mt-5 max-w-sm text-xs sm:text-sm leading-relaxed text-zinc-400 font-light">
              {t("brand.heroDescription")}
            </p>
          </div>

          {/* Bottom Return to Home Navigation */}
          <div className="hidden lg:flex items-center justify-between border-t border-white/[0.06] pt-6">
            <Link
              className="group inline-flex items-center gap-2 text-xs text-zinc-400 transition-colors hover:text-[#f3e3be]"
              href="/"
            >
              <span className="transition-transform group-hover:-translate-x-1" aria-hidden="true">
                &larr;
              </span>
              <span>{t("landing.backHome")}</span>
            </Link>

            <span className="text-[11px] font-mono text-zinc-500">
              01 &middot; 门户收敛
            </span>
          </div>
        </section>

        {/* Right Side: Warm Paper Login Panel (Transition into Workspace Paper Surface) */}
        <section
          aria-labelledby="login-title"
          className="flex flex-col justify-between bg-[#FAF7F2] p-7 sm:p-10 lg:p-12 text-[#1C1B18] shadow-inner"
        >
          {/* Top Panel Bar */}
          <div className="flex items-center justify-between gap-4 border-b border-[#E5E0D5] pb-4">
            <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#8A857B]">
              {t("landing.login")} &middot; 空间通行
            </span>
            <LocaleSwitcher compact />
          </div>

          {/* Core Form Area */}
          <div className="w-full py-8 lg:py-4">
            <div className="mb-6">
              <h2
                className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-[#1C1B18]"
                id="login-title"
              >
                {t("auth.welcome")}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-[#736E65] font-light">
                {t("auth.subtitle")}
              </p>
            </div>

            <LoginForm />

            <p className="mt-6 text-center text-[11px] leading-5 text-[#8A857B] font-light">
              {t("auth.privateSpace")}
            </p>
          </div>

          {/* Bottom Trust Assurance */}
          <div className="border-t border-[#E5E0D5] pt-4 text-center text-[11px] text-[#8A857B] font-light">
            {t("brand.heroTrust")}
          </div>
        </section>

      </div>
    </main>
  );
}

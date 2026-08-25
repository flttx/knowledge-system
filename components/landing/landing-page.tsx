"use client";

import Link from "next/link";

import { BentoGrid } from "@/components/brand/bento-grid";
import { CinematicBackdrop } from "@/components/brand/cinematic-backdrop";
import { FeatureGrid } from "@/components/brand/feature-grid";
import { InkCanvas } from "@/components/brand/ink-canvas";
import { InteractiveSandbox } from "@/components/brand/interactive-sandbox";
import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { ThemeToggle } from "@/components/theme/theme-provider";

export function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="relative min-h-dvh bg-[#f7f4ed] text-zinc-900 dark:bg-[#020408] dark:text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-amber-200/60 dark:selection:bg-slate-700/40 selection:text-zinc-900 dark:selection:text-white transition-colors duration-500">
      {/* 1. High-Impact Monumental Monolith Backdrop Image */}
      <CinematicBackdrop />

      {/* 2. Atmospheric Ambient Dust & Knowledge Resonance Canvas */}
      <InkCanvas />

      {/* Main Content Layer */}
      <div className="relative z-10">
        {/* Global Minimalist Frosted Stone Navbar */}
        <header className="sticky top-0 z-50 border-b border-black/[0.07] bg-[#f7f4ed]/80 dark:border-white/[0.08] dark:bg-[#020408]/75 backdrop-blur-xl py-3 sm:py-4 transition-all">
          <div className="public-brand-container flex items-center justify-between">
            <Link className="flex items-center gap-2.5 sm:gap-3 group" href="/" aria-label="Knowledge 首页">
              <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-serif font-bold text-white shadow-[0_0_12px_rgba(0,0,0,0.12)] border border-black/10 dark:border-white/20 select-none transition-transform group-hover:scale-105">
                K
              </span>
              <span className="text-sm font-semibold tracking-wider uppercase text-zinc-800 dark:text-zinc-200">
                Knowledge
              </span>
            </Link>

            <nav className="flex items-center gap-2.5 sm:gap-6 text-xs text-zinc-600 dark:text-zinc-400">
              <a className="hidden sm:inline-block hover:text-zinc-900 dark:hover:text-white transition-colors tracking-wide" href="#features">
                {t("landing.navCapabilities")}
              </a>
              <a className="hidden sm:inline-block hover:text-zinc-900 dark:hover:text-white transition-colors tracking-wide" href="#sandbox">
                {t("brand.navJourney")}
              </a>
              <a className="hidden sm:inline-block hover:text-zinc-900 dark:hover:text-white transition-colors tracking-wide" href="#realms">
                {t("brand.navOwnership")}
              </a>
              <ThemeToggle compact />
              <LocaleSwitcher compact />
              <Link
                className="inline-flex h-8 items-center justify-center rounded-lg bg-black/[0.05] text-zinc-800 hover:bg-black/[0.09] border border-black/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 dark:border-white/20 px-3.5 sm:px-4 text-xs font-medium transition-all hover:scale-102 active:scale-98 backdrop-blur-md shadow-2xs"
                href="/login"
              >
                {t("brand.login")} &rarr;
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section: Left-aligned Negative Space Layout */}
        <section className="relative flex min-h-[calc(100dvh-57px)] sm:min-h-[90vh] flex-col justify-center pt-8 pb-16 sm:pt-20 sm:pb-28">
          <div className="public-brand-container grid w-full grid-cols-12">
            <div className="col-span-12 max-w-[620px] text-left lg:col-span-6 flex flex-col justify-center">
              {/* Minimal Overline Monolith Badge */}
              <div className="inline-flex self-start items-center gap-2 rounded-full border border-black/10 bg-white/70 dark:border-white/15 dark:bg-black/60 px-3.5 py-1 text-[11px] font-mono tracking-widest text-zinc-700 dark:text-zinc-300 backdrop-blur-md uppercase shadow-xs">
                <span className="size-1.5 rounded-full bg-amber-500 dark:bg-amber-300/90 animate-pulse" />
                <span>{t("brand.kicker")}</span>
              </div>

              {/* Primary Brand Typography */}
              <div className="mt-6 sm:mt-8">
                <h1 className="font-serif text-4xl sm:text-7xl lg:text-8xl font-light tracking-tight text-zinc-900 dark:text-white leading-[1.1] drop-shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                  {t("brand.heroLineOne")}
                  <br />
                  {t("brand.heroLineTwo")}
                </h1>
                <p className="mt-3 sm:mt-4 text-xl sm:text-3xl lg:text-4xl font-light tracking-tight text-zinc-700 dark:text-zinc-200 drop-shadow-[0_1px_6px_rgba(0,0,0,0.04)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
                  {t("landing.title")}
                </p>
              </div>

              {/* Sub-description with Intellectual & Architectural Tone */}
              <p className="mt-4 sm:mt-6 max-w-lg text-xs sm:text-base leading-relaxed text-zinc-600 dark:text-zinc-300 font-light">
                {t("brand.heroDescription")}
              </p>

              {/* Minimal Editorial CTAs */}
              <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
                <Link
                  className="inline-flex h-10 sm:h-11 items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 px-6 sm:px-7 text-xs font-semibold uppercase tracking-wider transition-all hover:scale-102 active:scale-98 shadow-[0_10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
                  href="/login"
                >
                  {t("brand.heroCta")} &rarr;
                </Link>
                <a
                  className="inline-flex h-10 sm:h-11 items-center justify-center rounded-xl border border-black/15 bg-white/70 text-zinc-800 hover:bg-black/5 dark:border-white/20 dark:bg-black/60 dark:text-zinc-200 dark:hover:bg-white/[0.12] dark:hover:border-white/40 px-5 sm:px-6 text-xs font-medium uppercase tracking-wider backdrop-blur-md transition-all hover:scale-102 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                  href="#features"
                >
                  {t("brand.heroSecondary")} &darr;
                </a>
              </div>

              {/* Architectural Scale Note Footprint */}
              <div className="mt-8 sm:mt-12 grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6 text-[10px] sm:text-[11px] font-mono text-zinc-500 dark:text-zinc-400 border-t border-black/10 dark:border-white/10 pt-4 max-w-lg">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">01</span>
                  <span className="truncate">{t("landing.captureTitle")}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">02</span>
                  <span className="truncate">{t("landing.organizeTitle")}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-zinc-800 dark:text-zinc-200 font-semibold">03</span>
                  <span className="truncate">{t("landing.connectTitle")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four-Column Minimalist Architectural Feature Grid */}
        <div id="features">
          <FeatureGrid />
        </div>

        {/* Autonomous Topology Showcase */}
        <section className="public-brand-section relative" id="sandbox">
          <div className="public-brand-container">
            <div className="public-brand-section-heading mb-16 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/70 dark:border-white/15 dark:bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono font-medium text-zinc-600 dark:text-zinc-400 uppercase tracking-wider shadow-xs">
                <span>{t("brand.journeyKicker")}</span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-serif font-normal tracking-tight text-zinc-900 dark:text-white">
                {t("brand.showcaseTitle")}
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto font-light">
                {t("brand.showcaseDescription")}
              </p>
            </div>
          </div>
          <div className="public-brand-container public-brand-container--wide">
            <InteractiveSandbox />
          </div>
        </section>

        {/* Bento Knowledge Gallery & Realms */}
        <BentoGrid />

        {/* Brutalist Archival Footer */}
        <footer className="border-t border-black/[0.08] bg-[#efebe1]/90 dark:border-white/[0.08] dark:bg-[#010204]/90 py-14 text-center text-xs text-zinc-500 dark:text-zinc-500 font-mono transition-colors duration-500">
          <div className="public-brand-container flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-zinc-700 dark:text-zinc-300">
              <span className="flex size-6 items-center justify-center rounded bg-zinc-900 text-[10px] font-serif font-bold text-white border border-black/10 dark:border-white/10">
                K
              </span>
              <span className="text-xs font-serif tracking-wider">Knowledge &middot; {t("landing.footerNote")}</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-zinc-500 dark:text-zinc-500">
              <span>{t("brand.footer")}</span>
              <span>&middot;</span>
              <span>持续整理</span>
              <span>&middot;</span>
              <span>自由连接</span>
              <span>&middot;</span>
              <span>Markdown 可带走</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

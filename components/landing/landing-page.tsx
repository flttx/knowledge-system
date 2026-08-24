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
    <div className="relative min-h-dvh bg-[#020408] text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-slate-700/40 selection:text-white">
      {/* 1. High-Impact Monumental Monolith Backdrop Image */}
      <CinematicBackdrop />

      {/* 2. Atmospheric Ambient Dust & Knowledge Resonance Canvas */}
      <InkCanvas />

      {/* Main Content Layer */}
      <div className="relative z-10">
        {/* Global Minimalist Frosted Stone Navbar */}
        <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#020408]/75 backdrop-blur-xl py-4 transition-all">
          <div className="public-brand-container flex items-center justify-between">
            <Link className="flex items-center gap-3 group" href="/" aria-label="Knowledge 首页">
              <span className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 text-xs font-serif font-bold text-white shadow-[0_0_12px_rgba(255,255,255,0.12)] border border-white/20 select-none transition-transform group-hover:scale-105">
                K
              </span>
              <span className="text-sm font-semibold tracking-wider uppercase text-zinc-200">
                Knowledge
              </span>
            </Link>

            <nav className="flex items-center gap-6 text-xs text-zinc-400">
              <a className="hidden sm:inline-block hover:text-white transition-colors tracking-wide" href="#features">
                {t("landing.navCapabilities")}
              </a>
              <a className="hidden sm:inline-block hover:text-white transition-colors tracking-wide" href="#sandbox">
                {t("brand.navJourney")}
              </a>
              <a className="hidden sm:inline-block hover:text-white transition-colors tracking-wide" href="#realms">
                {t("brand.navOwnership")}
              </a>
              <ThemeToggle compact />
              <LocaleSwitcher compact />
              <Link
                className="inline-flex h-8 items-center justify-center rounded-lg bg-white/10 px-4 text-xs font-medium text-white hover:bg-white/20 transition-all hover:scale-102 active:scale-98 border border-white/20 backdrop-blur-md shadow-xs"
                href="/login"
              >
                {t("brand.login")} &rarr;
              </Link>
            </nav>
          </div>
        </header>

        {/* Hero Section: Left-aligned Negative Space Layout */}
        <section className="relative flex min-h-[90vh] items-center pt-20 pb-28">
          <div className="public-brand-container grid w-full grid-cols-12">
            <div className="col-span-12 max-w-[620px] text-left lg:col-span-6">
              {/* Minimal Overline Monolith Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-1 text-[11px] font-mono tracking-widest text-zinc-300 backdrop-blur-md uppercase shadow-sm">
                <span className="size-1.5 rounded-full bg-amber-300/90 animate-pulse" />
                <span>{t("brand.kicker")}</span>
              </div>

              {/* Primary Brand Typography */}
              <div className="mt-8">
                <h1 className="font-serif text-5xl sm:text-7xl lg:text-8xl font-light tracking-tight text-white leading-[1.04] drop-shadow-md">
                  {t("brand.heroLineOne")}
                  <br />
                  {t("brand.heroLineTwo")}
                </h1>
                <p className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-zinc-300 drop-shadow-sm">
                  {t("landing.title")}
                </p>
              </div>

              {/* Sub-description with Intellectual & Architectural Tone */}
              <p className="mt-6 max-w-lg text-sm sm:text-base leading-relaxed text-zinc-300/90 font-light drop-shadow-sm">
                {t("brand.heroDescription")}
              </p>

              {/* Minimal Editorial CTAs */}
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-7 text-xs font-semibold uppercase tracking-wider text-black transition-all hover:bg-zinc-200 hover:scale-102 active:scale-98 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                  href="/login"
                >
                  {t("brand.heroCta")} &rarr;
                </Link>
                <a
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-black/60 px-6 text-xs font-medium uppercase tracking-wider text-zinc-200 backdrop-blur-md hover:bg-white/[0.12] hover:border-white/40 transition-all hover:scale-102"
                  href="#sandbox"
                >
                  {t("brand.heroSecondary")} &darr;
                </a>
              </div>

              {/* Architectural Scale Note Footprint */}
              <div className="mt-12 flex items-center gap-6 text-[11px] font-mono text-zinc-400 border-t border-white/10 pt-4 max-w-lg">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 font-semibold">01</span>
                  <span>{t("landing.captureTitle")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 font-semibold">02</span>
                  <span>{t("landing.organizeTitle")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-zinc-200 font-semibold">03</span>
                  <span>{t("landing.connectTitle")}</span>
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
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                <span>{t("brand.journeyKicker")}</span>
              </div>
              <h2 className="mt-3 text-3xl sm:text-4xl font-serif font-normal tracking-tight text-white">
                {t("brand.showcaseTitle")}
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-zinc-400 max-w-xl mx-auto font-light">
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
        <footer className="border-t border-white/[0.08] bg-[#010204]/90 py-14 text-center text-xs text-zinc-500 font-mono">
          <div className="public-brand-container flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-zinc-300">
              <span className="flex size-6 items-center justify-center rounded bg-zinc-800 text-[10px] font-serif font-bold text-white border border-white/10">
                K
              </span>
              <span className="text-xs font-serif tracking-wider">Knowledge &middot; {t("landing.footerNote")}</span>
            </div>

            <div className="flex items-center gap-6 text-[11px] text-zinc-500">
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

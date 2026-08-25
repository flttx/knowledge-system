"use client";

import { GraphIcon, InboxIcon, NoteIcon, ShieldIcon } from "@/components/icons";
import { useI18n } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n/locales";

const FEATURES = [
  {
    icon: InboxIcon,
    titleKey: "landing.captureTitle",
    descriptionKey: "landing.captureDescription",
    tag: "CAPTURE",
  },
  {
    icon: NoteIcon,
    titleKey: "landing.organizeTitle",
    descriptionKey: "landing.organizeDescription",
    tag: "ORGANIZE",
  },
  {
    icon: GraphIcon,
    titleKey: "landing.connectTitle",
    descriptionKey: "landing.connectDescription",
    tag: "CONNECT",
  },
  {
    icon: ShieldIcon,
    titleKey: "brand.ownershipMarkdown",
    descriptionKey: "brand.ownershipDescription",
    tag: "PORTABLE",
  },
];

export function FeatureGrid() {
  const { t } = useI18n();

  return (
    <section className="relative z-10 mx-auto mt-4 sm:-mt-10 pb-0 font-sans">
      <div className="public-brand-container public-brand-container--feature">
        <div className="rounded-2xl border border-black/[0.08] bg-white/80 dark:border-white/[0.08] dark:bg-[#04070d]/80 p-5 sm:p-7 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)] transition-all duration-500">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.titleKey}
                  className="group relative flex flex-col justify-between rounded-xl border border-black/[0.06] bg-black/[0.015] hover:border-black/20 hover:bg-black/[0.035] hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] dark:border-white/[0.06] dark:bg-white/[0.015] dark:hover:border-white/20 dark:hover:bg-white/[0.04] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)] p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex size-10 items-center justify-center rounded-lg border border-black/10 bg-zinc-100 text-zinc-800 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-200 transition-transform duration-300 group-hover:scale-105 group-hover:border-black/30 dark:group-hover:border-white/30">
                        <Icon size={16} />
                      </span>
                      <span className="rounded border border-black/10 bg-black/[0.03] text-zinc-600 dark:border-white/10 dark:bg-white/[0.03] dark:text-zinc-400 px-2 py-0.5 text-[10px] font-mono tracking-wider">
                        {feature.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white transition-colors group-hover:text-zinc-700 dark:group-hover:text-zinc-200">
                      {t(feature.titleKey as TranslationKey)}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400 font-light">
                      {t(feature.descriptionKey as TranslationKey)}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-black/[0.06] dark:border-white/[0.05] flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-500 font-mono">
                    <span>KNOWLEDGE WORKFLOW</span>
                    <span className="text-zinc-800 dark:text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100">&rarr;</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

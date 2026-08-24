"use client";

import { useRef, useState, type MouseEvent } from "react";
import { ArrowUpRightIcon, GraphIcon, InboxIcon, NoteIcon } from "@/components/icons";
import { useI18n } from "@/components/i18n/locale-provider";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
}

function BentoCard({ children, className = "" }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tilt, setTilt] = useState<{ rotateX: number; rotateY: number }>({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -2.5;
    const rotateY = ((x - centerX) / centerX) * 2.5;
    setTilt({ rotateX, rotateY });
  }

  function handleMouseLeave() {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.008, 1.008, 1.008)`
          : "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
        transition: isHovered ? "transform 0.1s ease-out" : "transform 0.4s ease-out",
      }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#04070e]/70 p-7 sm:p-8 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all duration-300 hover:border-white/20 hover:bg-[#070b14]/80 font-sans ${className}`}
    >
      {/* Dynamic Subdued Monolith Spotlight */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255, 255, 255, 0.06), transparent 70%)`,
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function BentoGrid() {
  const { t } = useI18n();

  return (
    <section className="public-brand-section relative z-10 font-sans" id="realms">
      <div className="public-brand-container public-brand-container--wide">
        {/* Section Header */}
        <div className="public-brand-section-heading mb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1 text-[11px] font-mono tracking-wider text-zinc-400">
            <span className="size-1.5 rounded-full bg-zinc-400 animate-pulse" />
            <span>{t("brand.journeyKicker")}</span>
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl font-serif font-normal tracking-tight text-white">
            {t("brand.journeyTitle")}
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed font-light">
            {t("brand.journeyDescription")}
          </p>
        </div>

        {/* Bento Grid Matrix */}
        <div className="grid gap-5 md:grid-cols-3">
          {/* Card 1: Large Featured Star Graph (Spans 2 cols) */}
          <BentoCard className="md:col-span-2 min-h-[300px] flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-200 shadow-md mb-4">
                  <GraphIcon size={18} />
                </span>
                <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">03 &middot; 建立连接</span>
                <h3 className="text-xl font-semibold text-white mt-1.5 tracking-tight">{t("brand.connectTitle")}</h3>
                <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 font-light max-w-lg">
                  {t("brand.connectDescription")}
                </p>
              </div>

              {/* Minimal Geometric Graph Visual */}
              <div className="hidden sm:block w-40 h-32 rounded-xl border border-white/10 bg-[#020306] p-3 shadow-inner">
                <svg className="size-full" viewBox="0 0 100 80">
                  <line x1="50" y1="40" x2="25" y2="20" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" />
                  <line x1="50" y1="40" x2="75" y2="25" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="0.8" />
                  <line x1="50" y1="40" x2="50" y2="65" stroke="rgba(254, 240, 138, 0.4)" strokeWidth="0.8" strokeDasharray="2 2" />
                  <circle cx="50" cy="40" r="5" fill="#334155" />
                  <circle cx="25" cy="20" r="3.5" fill="#64748b" />
                  <circle cx="75" cy="25" r="3.5" fill="#94a3b8" />
                  <circle cx="50" cy="65" r="4" fill="#fef08a" opacity="0.85" />
                </svg>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 pt-4 border-t border-white/[0.06] font-mono text-[11px]">
              <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-zinc-400">
                #相关笔记
              </span>
              <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-zinc-400">
                #阅读方法
              </span>
              <span className="rounded border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-zinc-400">
                #双向链接
              </span>
            </div>
          </BentoCard>

          {/* Card 2: Quick Capture */}
          <BentoCard className="flex flex-col justify-between">
            <div>
              <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-200 shadow-md mb-4">
                <InboxIcon size={18} />
              </span>
              <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">01 &middot; 先留下</span>
              <h3 className="text-xl font-semibold text-white mt-1.5 tracking-tight">{t("brand.captureTitle")}</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 font-light">
                {t("brand.captureDescription")}
              </p>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-[11px] text-zinc-400 font-mono">
              “先记录下来，之后再想清楚。”
            </div>
          </BentoCard>

          {/* Card 3: Organize */}
          <BentoCard className="flex flex-col justify-between">
            <div>
              <span className="flex size-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900 text-zinc-200 shadow-md mb-4">
                <NoteIcon size={18} />
              </span>
              <span className="text-[11px] font-mono font-medium text-zinc-500 uppercase tracking-wider">02 &middot; 再整理</span>
              <h3 className="text-xl font-semibold text-white mt-1.5 tracking-tight">{t("brand.organizeTitle")}</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 font-light">
                {t("brand.organizeDescription")}
              </p>
            </div>

            <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-zinc-300">
              <span>可读 Markdown &middot; 由你确认</span>
              <ArrowUpRightIcon size={14} />
            </div>
          </BentoCard>

          {/* Card 4: Markdown Sovereignty (Spans 2 cols) */}
          <BentoCard className="md:col-span-2 flex flex-col justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-wider">
                <span className="size-1.5 rounded-full bg-amber-200" />
                <span>04 &middot; 带走你的知识</span>
              </span>
              <h3 className="text-xl font-semibold text-white mt-1.5 tracking-tight">{t("brand.ownershipTitle")}</h3>
              <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 font-light max-w-xl">
                {t("brand.ownershipDescription")}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-zinc-400 pt-4 border-t border-white/[0.06] font-mono">
              <span className="text-zinc-300">✓ Markdown 格式</span>
              <span className="text-zinc-300">✓ 完整导出</span>
              <span className="text-zinc-300">✓ 私人工作空间</span>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

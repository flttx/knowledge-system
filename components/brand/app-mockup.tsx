"use client";

import { InboxIcon, NoteIcon, GraphIcon, SearchIcon } from "@/components/icons";

export function AppInteractiveMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] p-2 shadow-2xl transition-all hover:shadow-[0_20px_50px_rgba(28,27,24,0.1)]">
      {/* Window Titlebar */}
      <div className="flex h-10 items-center justify-between border-b border-[var(--line)] px-4 bg-[var(--surface-muted)]/60 rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-[var(--accent)]" />
          <span className="size-2.5 rounded-full bg-[var(--line-strong)]" />
          <span className="size-2.5 rounded-full bg-[var(--line)]" />
        </div>
        <div className="flex items-center gap-2 text-xs font-serif font-medium text-[var(--ink-muted)]">
          <span className="flex size-4 items-center justify-center rounded-xs bg-[var(--accent)] text-[9px] font-serif font-bold text-white shadow-xs">知</span>
          <span>Knowledge &middot; 私密书斋册页</span>
        </div>
        <div className="w-16 text-right">
          <span className="inline-block rounded border border-[var(--line)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--ink-faint)]">⌘K 检索</span>
        </div>
      </div>

      {/* Mockup Workspace Body */}
      <div className="grid min-h-[390px] grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)_230px] bg-[var(--background)]">
        {/* Mock Sidebar - Scholar Index */}
        <div className="hidden md:flex flex-col border-r border-[var(--line)] bg-[var(--sidebar-bg)] p-3.5 gap-1.5 font-serif">
          <div className="text-[11px] font-bold text-[var(--ink-muted)] px-2 pb-1 uppercase tracking-wider">案牍目录</div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-[var(--accent-soft)] text-xs font-medium text-[var(--accent-strong)]">
            <NoteIcon size={14} />
            <span>格物笔记</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] transition-colors">
            <span className="flex items-center gap-2">
              <InboxIcon size={14} />
              <span>待研收件箱</span>
            </span>
            <span className="rounded-xs bg-[var(--accent)] px-1.5 text-[10px] text-white font-bold">3</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] transition-colors">
            <GraphIcon size={14} />
            <span>经纬星图</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] transition-colors">
            <SearchIcon size={14} />
            <span>钩沉搜索</span>
          </div>

          <div className="mt-auto pt-3 border-t border-[var(--line)] text-[11px] text-[var(--ink-faint)] px-2">
            <span>藏篇 24 卷 &middot; 来源 8 种</span>
          </div>
        </div>

        {/* Mock Note Editor - Rice Paper Text */}
        <div className="flex flex-col p-6 sm:p-8 bg-[var(--surface)] font-serif">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--line)] text-xs text-[var(--ink-faint)]">
            <span>岁次丙午 &middot; 格物札记第十六卷</span>
            <span className="flex items-center gap-1.5 text-[var(--accent-strong)] font-medium">
              <span className="size-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              已入墨录存
            </span>
          </div>

          <h2 className="mt-4 text-xl sm:text-2xl font-bold tracking-tight text-[var(--ink)] font-serif">
            格物致知：从寸草微尘到万卷经纬
          </h2>

          <div className="mt-3 flex flex-wrap gap-1.5 font-sans">
            <span className="rounded-xs bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-strong)] border border-[var(--accent)]/20">#治学心法</span>
            <span className="rounded-xs bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-soft)] border border-[var(--line)]">#双向链接</span>
          </div>

          <div className="mt-5 space-y-3.5 text-xs sm:text-sm leading-relaxed text-[var(--ink-soft)] font-serif">
            <p>
              古之治学者，必先<strong>博学而审问，慎思而明辨</strong>。阅读之碎片，如散落山川之微砾：
            </p>
            <div className="rounded-sm border-l-2 border-[var(--accent)] bg-[var(--surface-muted)]/50 p-3.5 text-xs italic text-[var(--ink)]">
              “引微言以阐奥旨，连断句而通古今。一念偶得，百川来汇。” —— [[朱熹 · 格物解]]
            </div>
            <p>
              本地 Agent 钩沉提炼义理，并通过 <span className="text-[var(--accent-strong)] font-semibold underline decoration-[var(--accent)]">[[双向经纬图谱]]</span> 自然连缀，使点滴灵感汇聚成思想汪洋。
            </p>
          </div>
        </div>

        {/* Mock Graph & Backlinks Inspector - Ink Graph */}
        <div className="hidden md:flex flex-col border-l border-[var(--line)] bg-[var(--surface-muted)]/30 p-4 font-serif">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--ink-muted)]">水墨星汉图谱</p>
            <span className="text-[10px] text-[var(--accent)] font-medium">经纬互见</span>
          </div>

          <div className="relative mt-3 h-38 w-full overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] flex items-center justify-center">
            <svg className="size-full" viewBox="0 0 160 120">
              <line x1="80" y1="60" x2="35" y2="35" stroke="var(--line-strong)" strokeWidth="1.2" />
              <line x1="80" y1="60" x2="125" y2="40" stroke="var(--line-strong)" strokeWidth="1.2" />
              <line x1="80" y1="60" x2="80" y2="95" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="3 3" />
              
              <circle cx="80" cy="60" r="9" fill="var(--accent)" />
              <circle cx="35" cy="35" r="7" fill="var(--ink-soft)" />
              <circle cx="125" cy="40" r="7" fill="var(--ink-muted)" />
              <circle cx="80" cy="95" r="7.5" fill="var(--accent-strong)" />

              <text x="80" y="78" fill="var(--accent-strong)" fontSize="7.5" fontWeight="600" textAnchor="middle">当前札记</text>
              <text x="35" y="49" fill="var(--ink-muted)" fontSize="7" textAnchor="middle">心斋</text>
              <text x="125" y="54" fill="var(--ink-muted)" fontSize="7" textAnchor="middle">经史微言</text>
              <text x="80" y="109" fill="var(--accent)" fontSize="7" fontWeight="600" textAnchor="middle">格物解 (AI)</text>
            </svg>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold text-[var(--ink)]">互见引文 (2)</p>
            <div className="mt-2 space-y-1.5 font-sans">
              <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-2 text-[11px] text-[var(--ink-muted)] hover:border-[var(--accent)] transition-colors cursor-pointer">
                <span className="font-serif font-semibold text-[var(--ink)]">读书治学札记</span>
                <p className="mt-0.5 truncate text-[10px] font-serif">...论及心学与格物之脉络...</p>
              </div>
              <div className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-2 text-[11px] text-[var(--ink-muted)] hover:border-[var(--accent)] transition-colors cursor-pointer">
                <span className="font-serif font-semibold text-[var(--ink)]">岁暮观澜录</span>
                <p className="mt-0.5 truncate text-[10px] font-serif">...引用了格物致知的经纬原则...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

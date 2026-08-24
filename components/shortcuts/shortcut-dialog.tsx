"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function GlobalShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Cmd+N / Ctrl+N -> New Note
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "n" && !event.shiftKey) {
        event.preventDefault();
        router.push("/notes?new=true");
      }

      // Cmd+/ or Ctrl+/ -> Shortcut CheatSheet
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }

      // Escape to close
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--line-strong)] bg-[var(--surface)] p-6 shadow-2xl transition-all animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--line)]">
          <h2 id="shortcut-title" className="text-base font-bold text-[var(--ink)]">
            ⌨️ 快捷键速查表
          </h2>
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-xs text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">全局搜索与命令面板</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">⌘K / Ctrl+K</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">快速创建新笔记</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">⌘N / Ctrl+N</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">打开本快捷键帮助</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">⌘/ / Ctrl+/</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">编辑器强制即时保存</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">⌘S / Ctrl+S</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">插入双向链接</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">[[ 双括号</kbd>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--ink-soft)]">文本加粗 / 斜体 / 行内代码</span>
            <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-[11px] text-[var(--ink-muted)]">⌘B / ⌘I / ⌘E</kbd>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-[var(--line)] text-right">
          <button
            type="button"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-[var(--surface-muted)] px-4 text-xs font-medium text-[var(--ink-soft)] hover:bg-[var(--line)] transition-colors"
            onClick={() => setOpen(false)}
          >
            知道了 (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}

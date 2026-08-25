"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, type ReactNode } from "react";

import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { ThemeToggle } from "@/components/theme/theme-provider";
import { ChevronLeftIcon, LogOutIcon, PlusIcon, SettingsIcon } from "@/components/icons";
import { SidebarMonolithWidget } from "@/components/shell/sidebar-monolith-widget";
import { CommandPalette } from "@/components/search/command-palette";
import { GlobalShortcuts } from "@/components/shortcuts/shortcut-dialog";
import { CompactCaptureDialog } from "@/components/capture/compact-capture-dialog";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/types";
import { navigationItems, tabletCaptureItem, tabletNavigationItems, type NavigationItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  contextPanel?: ReactNode;
  user: AuthUser;
}

function NavigationLink({ item }: { item: NavigationItem }) {
  const pathname = usePathname();
  const { t } = useI18n();
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "group relative flex min-h-[36px] h-[36px] items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-[var(--motion-normal)] ease-out",
        isActive
          ? "bg-[var(--accent-soft)] text-[var(--ink)] font-medium"
          : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
      )}
      href={item.href}
    >
      <Icon className={cn("shrink-0 transition-colors duration-[var(--motion-normal)]", isActive ? "text-[var(--accent-strong)]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]")} size={18} />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

function UserBadge({ user }: { user: AuthUser }) {
  const { t } = useI18n();
  const label = user.displayName || user.username || t("shell.user");
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <div className="border-t border-[var(--line)] pt-3.5">
      <div className="flex items-center gap-2 px-1">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white select-none">{initial}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-semibold text-[var(--ink)] leading-tight">{label}</span>
          <span className="block truncate text-[11px] text-[var(--ink-faint)] leading-tight">@{user.username}</span>
        </span>
        <Link
          aria-label={t("nav.settings")}
          className="flex size-7 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
          href="/settings"
          title={t("nav.settings")}
        >
          <SettingsIcon size={15} />
        </Link>
        <form action={logoutAction}>
          <button
            aria-label={t("shell.logout")}
            className="flex size-7 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] transition-colors"
            title={t("shell.logout")}
            type="submit"
          >
            <LogOutIcon size={15} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ children, contextPanel, user }: AppShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const [compactCaptureOpen, setCompactCaptureOpen] = useState(false);
  const mobileItems = [...tabletNavigationItems.slice(0, 2), tabletCaptureItem, ...tabletNavigationItems.slice(2)];

  // Listen for global quick capture open event
  useEffect(() => {
    const handleOpen = () => setCompactCaptureOpen(true);
    window.addEventListener("knowledge:open-quick-capture", handleOpen);
    return () => window.removeEventListener("knowledge:open-quick-capture", handleOpen);
  }, []);

  const isSubPage = (pathname.startsWith("/notes/") && pathname !== "/notes") ||
                    (pathname.startsWith("/library/") && pathname !== "/library");
  const parentPath = pathname.startsWith("/notes/") ? "/notes" : "/library";

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--ink)]">
      <CommandPalette />
      <GlobalShortcuts />
      <CompactCaptureDialog open={compactCaptureOpen} onClose={() => setCompactCaptureOpen(false)} />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[232px] flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] px-3.5 py-4 pb-7 lg:flex">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <span className="flex size-7 items-center justify-center rounded-md border border-[#c9a85d]/50 bg-[#1c1b18] text-xs font-serif font-bold text-[#f3e3be] shadow-xs select-none">
            K
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight text-[var(--ink)]">Knowledge</span>
          </span>
        </div>
        <nav aria-label={t("shell.mainNav")} className="flex flex-col gap-1">
          {navigationItems.map((item) => <NavigationLink item={item} key={item.href} />)}
          <Link className={cn("group flex min-h-[36px] h-[36px] items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors duration-[var(--motion-normal)] ease-out", pathname.startsWith("/settings") ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-strong)]" : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]")} href="/settings">
            <SettingsIcon className={cn("shrink-0 transition-colors", pathname.startsWith("/settings") ? "text-[var(--accent-strong)]" : "text-[var(--ink-muted)] group-hover:text-[var(--ink)]")} size={18} />
            <span className="truncate">{t("nav.settings")}</span>
          </Link>
        </nav>

        {/* 3D Geometric Knowledge Prism Widget */}
        <SidebarMonolithWidget />

        <div className="mb-3 flex items-center justify-between px-1">
          <LocaleSwitcher compact />
        </div>
        <UserBadge user={user} />
      </aside>

      <div className="lg:pl-[232px]">
        {/* Mobile / iPad Split-Screen Header */}
        <header className="app-header-surface sticky top-0 z-10 flex h-13 items-center justify-between border-b border-[var(--line)] px-3 sm:px-4 lg:hidden">
          <div className="flex items-center gap-2 min-w-0">
            {isSubPage ? (
              <Link
                href={parentPath}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] transition-colors"
                title="返回上一级"
              >
                <ChevronLeftIcon size={16} />
                <span>返回</span>
              </Link>
            ) : (
              <Link className="flex items-center gap-2" href="/home">
                <span className="flex size-6 items-center justify-center rounded-md border border-[#c9a85d]/50 bg-[#1c1b18] text-[11px] font-serif font-bold text-[#f3e3be] select-none">
                  K
                </span>
                <span className="text-xs font-semibold truncate">Knowledge</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Note / Capture Direct Button on iPad / Narrow screen */}
            <button
              type="button"
              onClick={() => setCompactCaptureOpen(true)}
              className="flex h-7 items-center gap-1 rounded-md bg-[var(--accent-soft)] px-2 text-[11px] font-semibold text-[var(--accent-strong)] hover:bg-[var(--accent)]/20 transition-colors cursor-pointer"
              title="快速捕捉 / 极速新建"
            >
              <PlusIcon size={13} />
              <span>捕捉</span>
            </button>
            <ThemeToggle compact />
            <LocaleSwitcher compact />
            <Link aria-label={t("nav.settings")} className="flex size-7 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]" href="/settings">
              <SettingsIcon size={16} />
            </Link>
            <form action={logoutAction}>
              <button
                aria-label={t("shell.logout")}
                className="flex size-7 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--danger)] transition-colors"
                title={t("shell.logout")}
                type="submit"
              >
                <LogOutIcon size={15} />
              </button>
            </form>
          </div>
        </header>

        {/* Desktop Workspace Topbar */}
        <header className="sticky top-0 z-10 hidden h-13 items-center justify-between border-b border-[var(--line)] bg-[var(--glass-bg)] backdrop-blur-md px-8 lg:flex">
          <div className="flex items-center gap-2 text-xs text-[var(--ink-muted)]">
            <span className="flex size-4 items-center justify-center rounded-[3px] border border-[#c9a85d]/40 bg-[#1c1b18] text-[9px] font-serif font-bold text-[#f3e3be]">
              K
            </span>
            <span className="font-semibold text-[var(--ink)]">Knowledge</span>
            <span>/</span>
            <span className="capitalize">{pathname.split("/")[1] || "Workspace"}</span>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => {
                const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true });
                document.dispatchEvent(event);
              }}
              className="flex h-8 items-center gap-2.5 rounded-md border border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--ink-muted)] hover:border-[var(--line-strong)] hover:text-[var(--ink)] shadow-2xs transition-all"
            >
              <span>搜索或执行命令...</span>
              <kbd className="rounded border border-[var(--line)] bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--ink-faint)]">⌘K</kbd>
            </button>
            <button
              type="button"
              onClick={() => setCompactCaptureOpen(true)}
              className="inline-flex h-8 items-center justify-center rounded-md bg-[var(--ink)] px-3 text-xs font-semibold text-[var(--surface)] shadow-xs hover:bg-[var(--ink-soft)] transition-colors cursor-pointer"
            >
              + 快速捕捉
            </button>
          </div>
        </header>

        <div className={cn("min-h-[calc(100dvh-3.5rem)]", contextPanel && "lg:flex")}>
          <main className="page-enter min-w-0 flex-1 px-3 pb-20 pt-4 sm:px-6 lg:px-10 lg:pb-12 lg:pt-7">{children}</main>
          {contextPanel ? <aside className="hidden w-[280px] shrink-0 border-l border-[var(--line)] px-6 py-10 xl:block">{contextPanel}</aside> : null}
        </div>
      </div>

      {/* Mobile / iPad Bottom Navigation Bar */}
      <nav aria-label={t("shell.mobileNav")} className="mobile-nav-surface fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[var(--line)] px-1 pt-1 pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        {mobileItems.map((item) => {
          const isCapture = item.href === "/capture";
          const isActive = !isCapture && (pathname === item.href || pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          if (isCapture) {
            return (
              <button
                type="button"
                key={item.href}
                onClick={() => setCompactCaptureOpen(true)}
                className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium text-[var(--accent-strong)] hover:text-[var(--accent)] cursor-pointer"
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-2xs">
                  <Icon size={16} />
                </div>
                <span className="truncate text-[10px] font-semibold">{t(item.labelKey)}</span>
              </button>
            );
          }

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md text-[11px] font-medium transition-colors",
                isActive ? "text-[var(--accent-strong)] font-semibold" : "text-[var(--ink-muted)] hover:text-[var(--ink)]",
              )}
              href={item.href}
              key={item.href}
            >
              <Icon size={17} />
              <span className="truncate text-[10px]">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

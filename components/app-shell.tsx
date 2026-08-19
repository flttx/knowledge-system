"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { LocaleSwitcher, useI18n } from "@/components/i18n/locale-provider";
import { LogOutIcon, SettingsIcon } from "@/components/icons";
import { CommandPalette } from "@/components/search/command-palette";
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
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-[var(--accent-soft)] text-[var(--ink)]"
          : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]",
      )}
      href={item.href}
    >
      <Icon className={cn("shrink-0", isActive && "text-[var(--accent-strong)]")} size={18} />
      <span className="font-medium">{t(item.labelKey)}</span>
    </Link>
  );
}

function UserBadge({ user }: { user: AuthUser }) {
  const { t } = useI18n();
  const label = user.displayName || user.username || t("shell.user");
  const initial = label.slice(0, 1).toUpperCase();

  return (
    <div className="border-t border-[var(--line)] pt-4">
      <div className="flex items-center gap-3 px-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--ink)] text-xs font-semibold text-white">{initial}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--ink)]">{label}</span>
          <span className="block truncate text-xs text-[var(--ink-faint)]">@{user.username}</span>
        </span>
        <Link aria-label={t("nav.settings")} className="rounded-md p-1.5 text-[var(--ink-faint)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]" href="/settings" title={t("nav.settings")}>
          <SettingsIcon size={16} />
        </Link>
        <form action={logoutAction}>
          <button aria-label={t("shell.logout")} className="rounded-md p-1.5 text-[var(--ink-faint)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]" title={t("shell.logout")} type="submit">
            <LogOutIcon size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({ children, contextPanel, user }: AppShellProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  const mobileItems = [...tabletNavigationItems.slice(0, 2), tabletCaptureItem, ...tabletNavigationItems.slice(2)];

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--ink)]">
      <CommandPalette />
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[224px] flex-col border-r border-[var(--line)] bg-[var(--background)] px-4 py-5 lg:flex">
        <div className="mb-9 flex items-center gap-3 px-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-[var(--ink)] text-sm font-semibold text-white">K</span>
          <span>
            <span className="block text-sm font-semibold tracking-[-0.01em]">Knowledge</span>
          </span>
        </div>
        <nav aria-label={t("shell.mainNav")} className="flex flex-1 flex-col gap-0.5">
          {navigationItems.map((item) => <NavigationLink item={item} key={item.href} />)}
          <div className="my-4 border-t border-[var(--line)]" />
          <Link className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors", pathname.startsWith("/settings") ? "bg-[var(--accent-soft)] text-[var(--ink)]" : "text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)]")} href="/settings">
            <SettingsIcon size={18} />
            <span className="font-medium">{t("nav.settings")}</span>
          </Link>
        </nav>
        <div className="mb-4 px-2"><LocaleSwitcher compact /></div>
        <UserBadge user={user} />
      </aside>

      <div className="lg:pl-[224px]">
        <header className="app-header-surface sticky top-0 z-10 flex h-14 items-center justify-between border-b border-[var(--line)] px-4 lg:hidden">
          <Link className="flex items-center gap-2.5" href="/home">
            <span className="flex size-7 items-center justify-center rounded-md bg-[var(--ink)] text-xs font-semibold text-white">K</span>
            <span className="text-sm font-semibold">Knowledge</span>
          </Link>
          <div className="flex items-center gap-2"><LocaleSwitcher compact /><Link aria-label={t("nav.settings")} className="rounded-md p-2 text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]" href="/settings"><SettingsIcon size={18} /></Link></div>
        </header>

        <div className={cn("min-h-[calc(100dvh-3.5rem)]", contextPanel && "lg:flex")}>
          <main className="page-enter min-w-0 flex-1 px-4 pb-24 pt-7 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">{children}</main>
          {contextPanel ? <aside className="hidden w-[280px] shrink-0 border-l border-[var(--line)] px-6 py-10 xl:block">{contextPanel}</aside> : null}
        </div>
      </div>

      <nav aria-label={t("shell.mobileNav")} className="mobile-nav-surface fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[var(--line)] px-1 pt-1.5 lg:hidden">
        {mobileItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return <Link aria-current={isActive ? "page" : undefined} className={cn("flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-md text-[10px] font-medium", isActive ? "text-[var(--accent-strong)]" : "text-[var(--ink-faint)]")} href={item.href} key={item.href}><Icon size={18} /><span>{t(item.labelKey)}</span></Link>;
        })}
      </nav>
    </div>
  );
}

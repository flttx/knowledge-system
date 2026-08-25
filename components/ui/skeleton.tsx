import { cn } from "@/lib/utils";
import { PageContainer, PageHeader, Surface } from "@/components/ui/workspace";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base atomic Skeleton primitive with shimmering animation
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton-shimmer rounded-md", className)}
      {...props}
    />
  );
}

/**
 * Heading Skeleton with proportional heights
 */
export function SkeletonHeading({
  level = "h2",
  className,
  width = "60%",
}: {
  level?: "h1" | "h2" | "h3" | "title";
  className?: string;
  width?: string | number;
}) {
  const heightClass =
    level === "title"
      ? "h-9 sm:h-10"
      : level === "h1"
      ? "h-8 sm:h-9"
      : level === "h2"
      ? "h-6 sm:h-7"
      : "h-5";

  return (
    <Skeleton
      className={cn(heightClass, "rounded-lg", className)}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
    />
  );
}

/**
 * Single line text skeleton
 */
export function SkeletonText({
  className,
  width = "100%",
  size = "md",
}: {
  className?: string;
  width?: string | number;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const heightClass =
    size === "xs"
      ? "h-3"
      : size === "sm"
      ? "h-3.5"
      : size === "lg"
      ? "h-5"
      : "h-4";

  return (
    <Skeleton
      className={cn(heightClass, "rounded", className)}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
    />
  );
}

/**
 * Multi-line paragraph skeleton with organic staggered line widths
 */
export function SkeletonParagraph({
  lines = 3,
  className,
  lineSpacing = "space-y-2.5",
  lastLineWidth = "60%",
}: {
  lines?: number;
  className?: string;
  lineSpacing?: string;
  lastLineWidth?: string;
}) {
  const widths = ["100%", "94%", "97%", "88%", "92%"];

  return (
    <div className={cn("w-full", lineSpacing, className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => {
        const isLast = index === lines - 1;
        const width = isLast ? lastLineWidth : widths[index % widths.length];
        return (
          <Skeleton
            key={index}
            className="h-3.5 rounded"
            style={{ width }}
          />
        );
      })}
    </div>
  );
}

/**
 * Badge / Pill Skeleton
 */
export function SkeletonBadge({
  className,
  width = "4rem",
}: {
  className?: string;
  width?: string | number;
}) {
  return (
    <Skeleton
      className={cn("h-5 rounded-md", className)}
      style={{ width: typeof width === "number" ? `${width}px` : width }}
    />
  );
}

/**
 * Page Header Skeleton
 */
export function SkeletonPageHeader({
  withEyebrow = true,
  withAction = true,
  className,
}: {
  withEyebrow?: boolean;
  withAction?: boolean;
  className?: string;
}) {
  return (
    <PageHeader className={cn("items-center justify-between pb-4 border-b border-[var(--line)]", className)}>
      <div className="space-y-2.5 max-w-lg w-full">
        {withEyebrow && <Skeleton className="h-4 w-28 rounded-full" />}
        <SkeletonHeading level="h1" width="55%" />
        <SkeletonText size="sm" width="80%" />
      </div>
      {withAction && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      )}
    </PageHeader>
  );
}

/**
 * Note Card Item Skeleton
 */
export function SkeletonNoteItem() {
  return (
    <li className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] list-none">
      <div className="flex items-center justify-between gap-4">
        <SkeletonHeading level="h2" width="45%" className="h-5.5" />
        <Skeleton className="h-4 w-20 rounded" />
      </div>

      <div className="mt-3.5 space-y-2">
        <Skeleton className="h-3.5 w-full rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--line)]">
        <div className="flex items-center gap-1.5">
          <SkeletonBadge width="3.5rem" />
          <SkeletonBadge width="4rem" />
        </div>
        <Skeleton className="h-3 w-16 rounded" />
      </div>
    </li>
  );
}

/**
 * Note List Skeleton
 */
export function SkeletonNoteList({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid gap-3.5 p-0 m-0" aria-label="正在加载笔记...">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonNoteItem key={index} />
      ))}
    </ul>
  );
}

/**
 * Note Detail / Editor Skeleton
 */
export function SkeletonNoteDetail() {
  return (
    <PageContainer width="writing" aria-label="正在加载笔记详情...">
      {/* Top Header Navigation & Status */}
      <PageHeader className="items-center justify-between pb-3 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16 rounded" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </PageHeader>

      {/* Main Editorial Surface */}
      <main className="mt-6 space-y-5">
        {/* Title Heading */}
        <SkeletonHeading level="title" width="65%" className="h-10 sm:h-11 rounded-xl" />

        {/* Tags & Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <SkeletonBadge width="4.5rem" />
            <SkeletonBadge width="3.5rem" />
          </div>
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>

        {/* Paper Markdown Editor Surface Skeleton */}
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)] p-6 sm:p-8 space-y-6">
          {/* Paragraph block 1 */}
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-[96%] rounded" />
            <Skeleton className="h-4 w-[92%] rounded" />
            <Skeleton className="h-4 w-[75%] rounded" />
          </div>

          {/* Subheading in markdown */}
          <SkeletonHeading level="h2" width="35%" className="mt-6" />

          {/* Paragraph block 2 */}
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-[90%] rounded" />
            <Skeleton className="h-4 w-[60%] rounded" />
          </div>

          {/* Quote block simulation */}
          <div className="border-l-2 border-[var(--line-strong)] pl-4 py-1 space-y-2">
            <Skeleton className="h-3.5 w-[85%] rounded" />
            <Skeleton className="h-3.5 w-[70%] rounded" />
          </div>
        </div>
      </main>

      {/* Connected Graph & Backlinks Section */}
      <div className="mt-10 pt-8 border-t border-[var(--line)]">
        <SkeletonBacklinks count={2} />
      </div>
    </PageContainer>
  );
}

/**
 * Library Source Item Skeleton
 */
export function SkeletonSourceItem() {
  return (
    <li className="relative rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)] list-none flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0 flex-1 space-y-2.5">
        <div className="flex items-center gap-2">
          <SkeletonBadge width="3rem" />
          <Skeleton className="h-3.5 w-24 rounded" />
        </div>
        <SkeletonHeading level="h2" width="50%" className="h-5" />
        <SkeletonText size="xs" width="35%" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="size-8 rounded-lg" />
      </div>
    </li>
  );
}

/**
 * Library Source List Skeleton
 */
export function SkeletonSourceList({ count = 4 }: { count?: number }) {
  return (
    <ul className="grid gap-3.5 p-0 m-0" aria-label="正在加载知识来源...">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonSourceItem key={index} />
      ))}
    </ul>
  );
}

/**
 * Library Source Detail Skeleton
 */
export function SkeletonSourceDetail() {
  return (
    <PageContainer width="detail" aria-label="正在加载来源详情...">
      <PageHeader className="items-center justify-between pb-4 border-b border-[var(--line)]">
        <Skeleton className="h-4 w-20 rounded" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-16 rounded-lg" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      </PageHeader>

      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <SkeletonBadge width="4rem" />
          <SkeletonHeading level="h1" width="60%" />
          <SkeletonText size="sm" width="40%" />
        </div>

        {/* Source metadata key-value rows */}
        <Surface className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4 pb-3 border-b border-[var(--line)]">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3.5 w-36 rounded col-span-2" />
          </div>
          <div className="grid grid-cols-3 gap-4 pb-3 border-b border-[var(--line)]">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3.5 w-28 rounded col-span-2" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3.5 w-48 rounded col-span-2" />
          </div>
        </Surface>

        {/* Highlights Section */}
        <div className="mt-8 pt-6 border-t border-[var(--line)] space-y-4">
          <div className="flex items-center justify-between">
            <SkeletonHeading level="h2" width="25%" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          <div className="space-y-3">
            <Surface className="p-4 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </Surface>
            <Surface className="p-4 space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </Surface>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * Inbox Item Skeleton
 */
export function SkeletonInboxItem() {
  return (
    <li className="workspace-list-row p-5 space-y-3 list-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SkeletonBadge width="3.5rem" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-14 rounded-md" />
          <Skeleton className="h-7 w-14 rounded-md" />
        </div>
      </div>

      <div className="space-y-2 pl-3 border-l-2 border-[var(--line-strong)]">
        <Skeleton className="h-4 w-full rounded" />
        <Skeleton className="h-4 w-5/6 rounded" />
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <Skeleton className="h-3 w-32 rounded" />
        <Skeleton className="h-3 w-20 rounded" />
      </div>
    </li>
  );
}

/**
 * Inbox List Skeleton
 */
export function SkeletonInboxList({ count = 3 }: { count?: number }) {
  return (
    <div className="workspace-surface mt-6 divide-y divide-[var(--line)]" aria-label="正在加载收件箱...">
      <ul className="p-0 m-0">
        {Array.from({ length: count }).map((_, index) => (
          <SkeletonInboxItem key={index} />
        ))}
      </ul>
    </div>
  );
}

/**
 * Backlinks Panel Skeleton
 */
export function SkeletonBacklinks({ count = 2 }: { count?: number }) {
  return (
    <aside className="mt-8 border-t border-[var(--line-strong)] pt-5" aria-label="正在加载双向链接...">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <SkeletonHeading level="h2" width="20%" className="h-5" />
        <Skeleton className="h-3 w-8 rounded" />
      </div>
      <ul className="space-y-2.5 p-0 m-0">
        {Array.from({ length: count }).map((_, index) => (
          <li key={index} className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2 list-none">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-3 w-4/5 rounded" />
          </li>
        ))}
      </ul>
    </aside>
  );
}

/**
 * Search Results List Skeleton
 */
export function SkeletonSearchResults({ count = 4 }: { count?: number }) {
  return (
    <ul className="workspace-surface divide-y divide-[var(--line)] p-0 m-0" aria-label="正在搜索内容...">
      {Array.from({ length: count }).map((_, index) => (
        <li key={index} className="workspace-list-row p-4 sm:px-5 space-y-2 list-none">
          <div className="flex items-center gap-2.5">
            <SkeletonBadge width="3rem" />
            <Skeleton className="h-4 w-48 rounded" />
          </div>
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-3/4 rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Home Dashboard Skeleton
 */
export function SkeletonHomeContent() {
  return (
    <PageContainer width="list" aria-label="正在加载知识主页...">
      {/* Top Header */}
      <SkeletonPageHeader withEyebrow withAction />

      {/* 3 Metric Cards */}
      <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 2 Main Content Panels */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="h-5 w-28 rounded" />
              </div>
              <Skeleton className="h-3.5 w-14 rounded" />
            </div>
            <SkeletonParagraph lines={3} />
            <div className="pt-4 border-t border-[var(--line)] flex justify-between items-center">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}

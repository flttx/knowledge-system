import type { ReactNode } from "react";

import { ArrowUpRightIcon } from "@/components/icons";

interface PagePlaceholderProps {
  description: string;
  icon: ReactNode;
  title: string;
}

export function PagePlaceholder({
  description,
  icon,
  title,
}: PagePlaceholderProps) {
  return (
    <section className="mx-auto flex min-h-[calc(100dvh-10rem)] max-w-4xl flex-col justify-center">
      <div className="mb-8 flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
        {icon}
      </div>
      <h1 className="max-w-2xl text-4xl font-bold tracking-[-0.045em] text-[var(--ink)] sm:text-5xl">{title}</h1>
      <p className="mt-5 max-w-xl text-base leading-7 text-[var(--ink-muted)]">{description}</p>
      <div className="mt-12 flex max-w-xl items-center justify-between border-t border-[var(--line)] pt-5 text-sm">
        <span className="text-[var(--ink-faint)]">基础壳层已就绪 · Batch A</span>
        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent-strong)]">
          下一阶段接入
          <ArrowUpRightIcon size={16} />
        </span>
      </div>
    </section>
  );
}

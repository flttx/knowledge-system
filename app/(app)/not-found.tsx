import Link from "next/link";
import { PageContainer } from "@/components/ui/workspace";

export default function AppNotFound() {
  return (
    <PageContainer width="detail">
      <div className="my-16 flex flex-col items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-xl text-[var(--accent-strong)] font-serif font-bold">
          404
        </span>
        <h1 className="mt-4 font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
          未找到相关内容
        </h1>
        <p className="mt-2 max-w-sm text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
          该笔记、文献或页面可能已被归档或移除。
        </p>

        <div className="mt-6">
          <Link
            href="/home"
            className="inline-flex h-8 items-center justify-center rounded-md bg-[var(--ink)] px-4 text-xs font-semibold text-[var(--surface)] hover:bg-[var(--ink-soft)] transition-colors"
          >
            返回工作台
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

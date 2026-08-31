"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/ui/workspace";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("App Route caught error:", error);
    }
  }, [error]);

  return (
    <PageContainer width="detail">
      <div className="my-12 flex flex-col items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--danger-soft)] text-xl text-[var(--danger)] font-serif font-bold">
          !
        </span>
        <h1 className="mt-4 font-serif text-xl sm:text-2xl font-semibold text-[var(--ink)]">
          知识系统遇到了一个问题
        </h1>
        <p className="mt-2 max-w-md text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
          {error.message || "未能成功加载页面内容，你的数据仍然安全保存在本地与数据库中。"}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button size="sm" onClick={() => reset()}>
            重新尝试
          </Button>
          <Link
            href="/home"
            className="inline-flex h-8 items-center justify-center rounded-md border border-[var(--line)] bg-[var(--surface-muted)] px-3 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--line)] transition-colors"
          >
            返回首页
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}

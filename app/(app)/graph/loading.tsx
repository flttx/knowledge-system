import { PageContainer, PageHeader } from "@/components/ui/workspace";
import { Skeleton, SkeletonHeading } from "@/components/ui/skeleton";

export default function GraphLoading() {
  return (
    <PageContainer width="canvas">
      <PageHeader className="pb-4 border-b border-[var(--line)]">
        <div className="space-y-2 max-w-md w-full">
          <Skeleton className="h-4 w-28 rounded-full" />
          <SkeletonHeading level="h1" width="40%" />
          <Skeleton className="h-3.5 w-60 rounded" />
        </div>
      </PageHeader>

      <div className="mt-6 h-[70vh] rounded-2xl border border-[var(--line)] bg-[var(--surface)] skeleton-shimmer flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="size-12 mx-auto rounded-full border-2 border-[var(--accent)] border-t-transparent animate-spin opacity-40" />
          <Skeleton className="h-4 w-32 mx-auto rounded" />
        </div>
      </div>
    </PageContainer>
  );
}

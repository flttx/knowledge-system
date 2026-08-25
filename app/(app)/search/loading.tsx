import { PageContainer } from "@/components/ui/workspace";
import { SkeletonPageHeader, SkeletonSearchResults } from "@/components/ui/skeleton";

export default function SearchLoading() {
  return (
    <PageContainer width="list">
      <SkeletonPageHeader withEyebrow={false} withAction={false} />
      <div className="mt-6 flex gap-3">
        <div className="h-10 flex-1 rounded-lg bg-[var(--surface-muted)] skeleton-shimmer" />
        <div className="h-10 w-32 rounded-lg bg-[var(--surface-muted)] skeleton-shimmer" />
      </div>
      <div className="mt-6">
        <SkeletonSearchResults count={4} />
      </div>
    </PageContainer>
  );
}

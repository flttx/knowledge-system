import { PageContainer } from "@/components/ui/workspace";
import { SkeletonPageHeader, SkeletonNoteList } from "@/components/ui/skeleton";

export default function NotesLoading() {
  return (
    <PageContainer width="list">
      <SkeletonPageHeader withEyebrow withAction />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="h-9 w-64 rounded-lg bg-[var(--surface-muted)] skeleton-shimmer" />
        <div className="h-9 w-40 rounded-lg bg-[var(--surface-muted)] skeleton-shimmer" />
      </div>
      <div className="mt-6">
        <SkeletonNoteList count={5} />
      </div>
    </PageContainer>
  );
}

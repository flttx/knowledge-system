import { PageContainer, PageHeader, Surface } from "@/components/ui/workspace";
import { Skeleton, SkeletonHeading, SkeletonParagraph } from "@/components/ui/skeleton";

export default function CaptureLoading() {
  return (
    <PageContainer width="writing">
      <PageHeader className="pb-4 border-b border-[var(--line)]">
        <div className="space-y-2 max-w-md w-full">
          <Skeleton className="h-4 w-24 rounded-full" />
          <SkeletonHeading level="h1" width="60%" />
          <Skeleton className="h-3.5 w-72 rounded" />
        </div>
      </PageHeader>

      <Surface className="mt-6 p-6 space-y-5">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
        <SkeletonParagraph lines={4} />
        <div className="pt-4 border-t border-[var(--line)] flex justify-end">
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </Surface>
    </PageContainer>
  );
}

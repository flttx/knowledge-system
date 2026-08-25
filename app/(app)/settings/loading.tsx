import { PageContainer, PageHeader, Surface } from "@/components/ui/workspace";
import { Skeleton, SkeletonHeading, SkeletonParagraph } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <PageContainer width="detail">
      <PageHeader className="pb-4 border-b border-[var(--line)]">
        <div className="space-y-2 max-w-md w-full">
          <SkeletonHeading level="h1" width="40%" />
          <Skeleton className="h-3.5 w-64 rounded" />
        </div>
      </PageHeader>

      <div className="mt-6 space-y-6">
        <Surface className="p-6 space-y-4">
          <SkeletonHeading level="h2" width="30%" />
          <SkeletonParagraph lines={2} />
          <div className="pt-2">
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </Surface>

        <Surface className="p-6 space-y-4">
          <SkeletonHeading level="h2" width="25%" />
          <SkeletonParagraph lines={3} />
        </Surface>
      </div>
    </PageContainer>
  );
}

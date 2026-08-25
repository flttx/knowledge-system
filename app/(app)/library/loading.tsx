import { PageContainer } from "@/components/ui/workspace";
import { SkeletonPageHeader, SkeletonSourceList } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <PageContainer width="list">
      <SkeletonPageHeader withEyebrow withAction />
      <div className="mt-6">
        <SkeletonSourceList count={4} />
      </div>
    </PageContainer>
  );
}

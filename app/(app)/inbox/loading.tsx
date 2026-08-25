import { PageContainer } from "@/components/ui/workspace";
import { SkeletonPageHeader, SkeletonInboxList } from "@/components/ui/skeleton";

export default function InboxLoading() {
  return (
    <PageContainer width="list">
      <SkeletonPageHeader withEyebrow withAction />
      <div className="mt-6">
        <SkeletonInboxList count={4} />
      </div>
    </PageContainer>
  );
}

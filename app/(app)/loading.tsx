import { PageContainer } from "@/components/ui/workspace";
import { SkeletonPageHeader, SkeletonParagraph } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <PageContainer width="list">
      <SkeletonPageHeader withEyebrow withAction />
      <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
        <SkeletonParagraph lines={5} />
      </div>
    </PageContainer>
  );
}

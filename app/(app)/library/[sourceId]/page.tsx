import { SourceDetail } from "@/components/sources/source-detail";

export const metadata = { title: "来源详情" };

interface SourcePageProps {
  params: Promise<{ sourceId: string }>;
}

export default async function SourcePage({ params }: SourcePageProps) {
  const { sourceId } = await params;
  return <SourceDetail sourceId={sourceId} />;
}

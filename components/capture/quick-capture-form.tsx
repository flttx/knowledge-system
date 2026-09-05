"use client";
import { CaptureForm } from "./capture-form";
import { useI18n } from "@/components/i18n/locale-provider";
import { PageContainer } from "@/components/ui/workspace";
import { useListParams } from "@/lib/hooks/use-list-query";
export function QuickCaptureForm() {
 const { t } = useI18n(); const { params } = useListParams();
 return <PageContainer width="list"><h1 className="workspace-page-title">{t("layout.captureTitle")}</h1><p className="workspace-page-description mb-6">{t("layout.captureDescription")}</p><CaptureForm sourceId={params.get("sourceId") ?? undefined} /></PageContainer>;
}

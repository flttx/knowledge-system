"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { PageContainer, Surface } from "@/components/ui/workspace";

interface ApiErrorPayload {
  error?: { message?: string };
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportPanel() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportArchive(): Promise<void> {
    setLoading(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/export", { method: "POST" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as ApiErrorPayload | null;
        throw new Error(body?.error?.message ?? "导出失败，请稍后重试。");
      }

      const fileName = /filename="([^"]+)"/.exec(
        response.headers.get("content-disposition") ?? "",
      )?.[1] ?? "knowledge-export.zip";
      downloadBlob(await response.blob(), fileName);
      setMessage(t("export.success"));
    } catch (exportError: unknown) {
      setError(exportError instanceof Error ? exportError.message : t("export.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageContainer width="detail">
      <div className="max-w-2xl">
        <p className="workspace-eyebrow">{t("export.eyebrow")}</p>
        <h1 className="workspace-page-title">{t("export.title")}</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">{t("export.description")}</p>
      </div>

      <Surface className="mt-8 p-5" ariaLabelledBy="export-includes-heading">
        <h2 id="export-includes-heading" className="text-lg font-semibold">{t("export.includes")}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-[var(--ink-muted)]">
          <li><span className="font-semibold text-[var(--ink)]">Notes/</span>：{t("export.notes")}</li>
          <li><span className="font-semibold text-[var(--ink)]">Archive/</span>：{t("export.archive")}</li>
          <li><span className="font-semibold text-[var(--ink)]">Sources/、Highlights/、QuickNotes/</span>：{t("export.content")}</li>
          <li><span className="font-semibold text-[var(--ink)]">relations.json</span>：{t("export.relations")}</li>
          <li><span className="font-semibold text-[var(--ink)]">manifest.json</span>：{t("export.manifest")}</li>
        </ul>

        {error ? <p className="mt-5 rounded-xl bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
        {message ? <p className="mt-5 rounded-xl bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]" role="status">{message}</p> : null}
        <Button className="mt-6" disabled={loading} aria-busy={loading} onClick={() => void exportArchive()}>
          {loading ? t("export.loading") : t("export.button")}
        </Button>
      </Surface>
    </PageContainer>
  );
}

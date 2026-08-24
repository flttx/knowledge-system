"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { MotionFeedback } from "@/components/motion/MotionFeedback";
import { PageContainer } from "@/components/ui/workspace";

type CaptureType = "highlight" | "quick_note";

interface SourceOption {
  id: string;
  title: string;
  publication: string | null;
}

interface SourceResponse {
  items: SourceOption[];
}

interface ApiErrorPayload {
  error?: { message?: string };
}

async function readResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;
  if (!response.ok) {
    throw new Error((body as ApiErrorPayload | null)?.error?.message ?? "Unable to save capture.");
  }
  return body as T;
}

export function QuickCaptureForm() {
  const { t } = useI18n();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [captureType, setCaptureType] = useState<CaptureType>("highlight");
  const [content, setContent] = useState("");
  const [personalThought, setPersonalThought] = useState("");
  const [sourceQuery, setSourceQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<SourceOption | null>(null);
  const [sources, setSources] = useState<SourceOption[]>([]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [sourceLoading, setSourceLoading] = useState(true);
  const [sourceError, setSourceError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/sources?limit=100")
      .then((response) => readResponse<SourceResponse>(response))
      .then((body) => {
        if (active) setSources(body.items);
      })
      .catch(() => {
        if (active) setSourceError(true);
      })
      .finally(() => {
        if (active) setSourceLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredSources = useMemo(() => {
    const value = sourceQuery.trim().toLocaleLowerCase();
    if (!value) return sources.slice(0, 8);
    return sources
      .filter((source) => `${source.title} ${source.publication ?? ""}`.toLocaleLowerCase().includes(value))
      .slice(0, 8);
  }, [sourceQuery, sources]);

  function handleSourceQuery(value: string): void {
    setSourceQuery(value);
    if (selectedSource && value !== selectedSource.title) setSelectedSource(null);
    setSourceOpen(true);
  }

  function selectSource(source: SourceOption): void {
    setSelectedSource(source);
    setSourceQuery(source.title);
    setSourceOpen(false);
  }

  function clearSource(): void {
    setSelectedSource(null);
    setSourceQuery("");
    setSourceOpen(false);
  }

  async function saveCapture(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setFeedback({ kind: "error", message: t("capture.content") });
      contentRef.current?.focus();
      return;
    }

    setSaving(true);
    setFeedback(null);
    const payload = captureType === "highlight"
      ? {
          text: trimmedContent,
          sourceId: selectedSource?.id,
          personalComment: personalThought.trim() || undefined,
        }
      : { content: trimmedContent, sourceId: selectedSource?.id };

    try {
      const response = await fetch(captureType === "highlight" ? "/api/highlights" : "/api/quick-notes", {
        body: JSON.stringify(payload),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      await readResponse(response);
      setContent("");
      setPersonalThought("");
      setSavedSuccess(true);
      setFeedback({ kind: "success", message: t("capture.saved") });
      window.setTimeout(() => setSavedSuccess(false), 2000);
      window.setTimeout(() => contentRef.current?.focus(), 0);
    } catch {
      setFeedback({ kind: "error", message: t("capture.saveFailed") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageContainer width="list" className="workspace-capture-layout">
      <div>
        <p className="workspace-eyebrow">{t("capture.eyebrow")}</p>
        <h1 className="workspace-page-title">{t("layout.captureTitle")}</h1>
        <p className="workspace-page-description">{t("layout.captureDescription")}</p>
      </div>

      <form className="mt-7 space-y-4" onSubmit={(event) => void saveCapture(event)}>
        <fieldset>
          <legend className="mb-2 text-xs font-semibold text-[var(--ink)]">{t("capture.type")}</legend>
          <div className="segmented-control flex w-full p-1 bg-[var(--surface-muted)] rounded-lg border border-[var(--line)]">
            {(["highlight", "quick_note"] as const).map((type) => (
              <button
                aria-pressed={captureType === type}
                className={`flex-1 min-h-[34px] rounded-md text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
                  captureType === type
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-xs font-semibold"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
                }`}
                key={type}
                onClick={() => setCaptureType(type)}
                type="button"
              >
                {type === "highlight" ? t("capture.highlight") : t("capture.quickNote")}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="relative">
          <label className="text-xs font-semibold text-[var(--ink)]" htmlFor="capture-source">{t("capture.source")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span></label>
          <div className="mt-1.5 flex gap-2">
            <input
              aria-autocomplete="list"
              aria-controls="capture-source-options"
              aria-expanded={sourceOpen}
              autoComplete="off"
              className="workspace-input flex-1"
              id="capture-source"
              onChange={(event) => handleSourceQuery(event.target.value)}
              onFocus={() => setSourceOpen(true)}
              placeholder={sourceLoading ? t("capture.loadingSources") : t("capture.chooseSource")}
              role="combobox"
              value={sourceQuery}
            />
            {selectedSource ? (
              <Button
                aria-label={t("capture.clear")}
                size="md"
                variant="secondary"
                onClick={clearSource}
                type="button"
              >
                {t("capture.clear")}
              </Button>
            ) : null}
          </div>
          {sourceOpen && !sourceLoading ? (
            <div className="absolute inset-x-0 top-[4.5rem] z-10 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface)] shadow-lg" id="capture-source-options">
              {filteredSources.length > 0 ? (
                <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
                  {filteredSources.map((source) => (
                    <li key={source.id}>
                      <button
                        aria-selected={selectedSource?.id === source.id}
                        className="w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)]"
                        onClick={() => selectSource(source)}
                        role="option"
                        type="button"
                      >
                        <span className="block truncate text-sm font-medium text-[var(--ink)]">{source.title}</span>
                        {source.publication ? (
                          <span className="mt-0.5 block truncate text-xs text-[var(--ink-muted)]">{source.publication}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="p-3.5 text-xs text-[var(--ink-muted)]">{t("capture.noMatch")}</p>
              )}
            </div>
          ) : null}
          {sourceError ? <p className="mt-1 text-xs text-[var(--ink-muted)]">{t("capture.sourceUnavailable")}</p> : null}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--ink)]" htmlFor="capture-content">
            {captureType === "highlight" ? t("capture.highlight") : t("capture.quickNote")}
          </label>
          <textarea
            aria-required="true"
            className="workspace-textarea mt-1.5 min-h-36 text-sm leading-7"
            id="capture-content"
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("capture.contentPlaceholder")}
            ref={contentRef}
            required
            value={content}
          />
        </div>

        {captureType === "highlight" ? (
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)]" htmlFor="capture-thought">
              {t("capture.thought")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span>
            </label>
            <textarea
              className="workspace-textarea mt-1.5 min-h-20 text-xs leading-6"
              id="capture-thought"
              onChange={(event) => setPersonalThought(event.target.value)}
              placeholder={t("capture.thoughtPlaceholder")}
              value={personalThought}
            />
          </div>
        ) : null}

        {feedback ? (
          <p
            aria-live="polite"
            className={feedback.kind === "success" ? "rounded-lg bg-[var(--success-soft)] p-3 text-xs font-medium text-[var(--success)]" : "rounded-lg bg-[var(--danger-soft)] p-3 text-xs text-[var(--danger)]"}
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}

        <Button
          aria-busy={saving}
          className="w-full mt-2"
          disabled={saving}
          size="md"
          type="submit"
        >
          <MotionFeedback trigger={savedSuccess || saving}>
            {saving
              ? t("capture.saving")
              : savedSuccess
              ? `✓ ${t("capture.saved")}`
              : t("capture.save")}
          </MotionFeedback>
        </Button>
      </form>
    </PageContainer>
  );
}

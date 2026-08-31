"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import { MotionFeedback } from "@/components/motion/MotionFeedback";
import { PageContainer } from "@/components/ui/workspace";

type CaptureType = "highlight" | "quick_note" | "screenshot";

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
  const imageInputRef = useRef<HTMLInputElement>(null);
  const sourceContainerRef = useRef<HTMLDivElement>(null);
  const [captureType, setCaptureType] = useState<CaptureType>("highlight");
  const [content, setContent] = useState("");
  const [personalThought, setPersonalThought] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [page, setPage] = useState("");
  const [location, setLocation] = useState("");
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
    if (!sourceOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (sourceContainerRef.current && !sourceContainerRef.current.contains(event.target as Node)) {
        setSourceOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSourceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [sourceOpen]);

  const handleImageFile = useCallback((file: File): void => {
    if (!(["image/png", "image/jpeg", "image/webp"] as string[]).includes(file.type) || file.size <= 0 || file.size > 10 * 1024 * 1024) {
      setFeedback({ kind: "error", message: t("capture.screenshotInvalid") });
      return;
    }
    setImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    setFeedback(null);
  }, [t]);

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

  useEffect(() => {
    if (captureType !== "screenshot") return;
    function handlePaste(event: ClipboardEvent): void {
      const pastedImage = Array.from(event.clipboardData?.files ?? []).find((file) => file.type.startsWith("image/"));
      if (pastedImage) {
        event.preventDefault();
        handleImageFile(pastedImage);
      }
    }
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, [captureType, handleImageFile]);

  useEffect(() => () => {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
  }, [imagePreviewUrl]);

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

  function clearImage(): void {
    setImage(null);
    setImagePreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function saveCapture(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const trimmedContent = content.trim();
    if (captureType !== "screenshot" && !trimmedContent) {
      setFeedback({ kind: "error", message: t("capture.content") });
      contentRef.current?.focus();
      return;
    }
    if (captureType === "screenshot" && !image) {
      setFeedback({ kind: "error", message: t("capture.screenshotRequired") });
      imageInputRef.current?.focus();
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
      const response = captureType === "screenshot"
        ? await fetch("/api/screenshots", {
            body: (() => {
              const form = new FormData();
              form.append("image", image as File);
              if (selectedSource) form.append("sourceId", selectedSource.id);
              if (page.trim()) form.append("page", page.trim());
              if (location.trim()) form.append("location", location.trim());
              if (personalThought.trim()) form.append("annotation", personalThought.trim());
              return form;
            })(),
            method: "POST",
          })
        : await fetch(captureType === "highlight" ? "/api/highlights" : "/api/quick-notes", {
            body: JSON.stringify(payload),
            headers: { "content-type": "application/json" },
            method: "POST",
          });
      await readResponse(response);
      setContent("");
      setPersonalThought("");
      setPage("");
      setLocation("");
      clearImage();
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
            {(["highlight", "quick_note", "screenshot"] as const).map((type) => (
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
                {type === "highlight" ? t("capture.highlight") : type === "quick_note" ? t("capture.quickNote") : t("capture.screenshot")}
              </button>
            ))}
          </div>
        </fieldset>

        <div ref={sourceContainerRef} className="relative">
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

        {captureType === "screenshot" ? (
          <div
            className="rounded-xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-muted)]/50 p-4 sm:p-5"
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              const droppedImage = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
              if (droppedImage) handleImageFile(droppedImage);
            }}
          >
            <input
              ref={imageInputRef}
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              id="capture-screenshot"
              onChange={(event) => {
                const selectedImage = event.target.files?.[0];
                if (selectedImage) handleImageFile(selectedImage);
              }}
              type="file"
            />
            {imagePreviewUrl ? (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("capture.screenshotPreview")}
                  className="max-h-[28rem] w-full rounded-lg object-contain bg-[var(--surface)]"
                  src={imagePreviewUrl}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => imageInputRef.current?.click()} type="button">
                    {t("capture.screenshotUpload")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearImage} type="button">
                    {t("capture.clear")}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                className="flex min-h-32 w-full flex-col items-center justify-center rounded-lg text-center text-sm text-[var(--ink-muted)] transition-colors hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onClick={() => imageInputRef.current?.click()}
                type="button"
              >
                <span className="font-semibold text-[var(--ink)]">{t("capture.screenshotUpload")}</span>
                <span className="mt-1 text-xs">{t("capture.screenshotPasteHint")}</span>
              </button>
            )}
          </div>
        ) : null}

        {captureType === "screenshot" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-[var(--ink)]" htmlFor="capture-page">{t("capture.page")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span></label>
              <input className="workspace-input mt-1.5" id="capture-page" onChange={(event) => setPage(event.target.value)} placeholder={t("capture.page")} value={page} />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--ink)]" htmlFor="capture-location">{t("capture.location")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span></label>
              <input className="workspace-input mt-1.5" id="capture-location" onChange={(event) => setLocation(event.target.value)} placeholder={t("capture.location")} value={location} />
            </div>
          </div>
        ) : null}

        {captureType !== "screenshot" ? <div>
          <label className="block text-xs font-semibold text-[var(--ink)]" htmlFor="capture-content">
            {captureType === "highlight" ? t("capture.highlight") : t("capture.quickNote")}
          </label>
          <textarea
            aria-required="true"
            className="workspace-textarea mt-1.5 min-h-36 text-sm leading-7"
            id="capture-content"
            inputMode="text"
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("capture.contentPlaceholder")}
            ref={contentRef}
            required
            value={content}
          />
        </div> : null}

        {captureType === "highlight" || captureType === "screenshot" ? (
          <div>
            <label className="block text-xs font-semibold text-[var(--ink)]" htmlFor="capture-thought">
              {captureType === "screenshot" ? t("capture.annotation") : t("capture.thought")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span>
            </label>
            <textarea
            className="workspace-textarea mt-1.5 min-h-20 text-xs leading-6"
            id="capture-thought"
            inputMode="text"
            onChange={(event) => setPersonalThought(event.target.value)}
              placeholder={captureType === "screenshot" ? t("capture.annotationPlaceholder") : t("capture.thoughtPlaceholder")}
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

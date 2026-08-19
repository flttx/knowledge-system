"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
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
      setFeedback({ kind: "success", message: t("capture.saved") });
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

      <form className="mt-8 space-y-5" onSubmit={(event) => void saveCapture(event)}>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-[var(--ink)]">{t("capture.type")}</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["highlight", "quick_note"] as const).map((type) => (
              <button
                aria-pressed={captureType === type}
                className={`min-h-11 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${captureType === type ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]"}`}
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
          <label className="text-sm font-semibold text-[var(--ink)]" htmlFor="capture-source">{t("capture.source")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span></label>
          <div className="mt-2 flex gap-2">
            <input
              aria-autocomplete="list"
              aria-controls="capture-source-options"
              aria-expanded={sourceOpen}
              autoComplete="off"
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-[var(--line-strong)] bg-white px-3.5 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              id="capture-source"
              onChange={(event) => handleSourceQuery(event.target.value)}
              onFocus={() => setSourceOpen(true)}
              placeholder={sourceLoading ? t("capture.loadingSources") : t("capture.chooseSource")}
              role="combobox"
              value={sourceQuery}
            />
            {selectedSource ? <button aria-label={t("capture.clear")} className="min-h-11 rounded-xl border border-[var(--line-strong)] px-3 text-sm text-[var(--ink-muted)] hover:bg-[var(--surface-muted)]" onClick={clearSource} type="button">{t("capture.clear")}</button> : null}
          </div>
          {sourceOpen && !sourceLoading ? <div className="absolute inset-x-0 top-[4.75rem] z-10 overflow-hidden rounded-xl border border-[var(--line)] bg-white shadow-lg" id="capture-source-options">
            {filteredSources.length > 0 ? <ul className="max-h-60 overflow-y-auto p-1" role="listbox">
              {filteredSources.map((source) => <li key={source.id}><button aria-selected={selectedSource?.id === source.id} className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--surface-muted)]" onClick={() => selectSource(source)} role="option" type="button"><span className="block truncate text-sm font-semibold text-[var(--ink)]">{source.title}</span>{source.publication ? <span className="mt-0.5 block truncate text-xs text-[var(--ink-muted)]">{source.publication}</span> : null}</button></li>)}
            </ul> : <p className="p-4 text-sm text-[var(--ink-muted)]">{t("capture.noMatch")}</p>}
          </div> : null}
          {sourceError ? <p className="mt-2 text-xs text-[var(--ink-muted)]">{t("capture.sourceUnavailable")}</p> : null}
        </div>

        <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="capture-content">{captureType === "highlight" ? t("capture.highlight") : t("capture.quickNote")}
          <textarea
            aria-required="true"
            className="mt-2 min-h-40 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-white px-3.5 py-3 text-base leading-7 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            id="capture-content"
            onChange={(event) => setContent(event.target.value)}
            placeholder={t("capture.contentPlaceholder")}
            ref={contentRef}
            required
            value={content}
          />
        </label>

        {captureType === "highlight" ? <label className="block text-sm font-semibold text-[var(--ink)]" htmlFor="capture-thought">{t("capture.thought")} <span className="font-normal text-[var(--ink-faint)]">({t("capture.optional")})</span>
          <textarea className="mt-2 min-h-24 w-full resize-y rounded-xl border border-[var(--line-strong)] bg-white px-3.5 py-3 text-sm leading-6 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]" id="capture-thought" onChange={(event) => setPersonalThought(event.target.value)} placeholder={t("capture.thoughtPlaceholder")} value={personalThought} />
        </label> : null}

        {feedback ? <p aria-live="polite" className={feedback.kind === "success" ? "text-sm font-medium text-[var(--accent-strong)]" : "text-sm text-[var(--danger)]"} role={feedback.kind === "error" ? "alert" : "status"}>{feedback.message}</p> : null}
        <Button aria-busy={saving} className="min-h-12 w-full text-base" disabled={saving} type="submit">{saving ? t("capture.saving") : t("capture.save")}</Button>
      </form>
    </PageContainer>
  );
}

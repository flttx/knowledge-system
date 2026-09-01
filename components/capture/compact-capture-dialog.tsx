"use client";

import { useEffect, useId, useRef, useState, type ClipboardEvent, type DragEvent, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CaptureIcon,
  CloseIcon,
  DocumentIcon,
  HighlightIcon,
  ImageIcon,
  SparklesIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { requestJson } from "@/lib/api/client";
import { useDialogFocusTrap } from "@/lib/hooks/use-dialog-focus-trap";
import { getLastEditedNote, type LastEditedNoteInfo } from "@/lib/notes/last-note";
import { cn } from "@/lib/utils";

export interface CompactCaptureDialogProps {
  open: boolean;
  onClose: () => void;
}

type CaptureTab = "quick-note" | "highlight" | "screenshot";

export function CompactCaptureDialog({ open, onClose }: CompactCaptureDialogProps) {
  const router = useRouter();
  const [tab, setTab] = useState<CaptureTab>("quick-note");
  const [lastNote, setLastNote] = useState<LastEditedNoteInfo | null>(() => getLastEditedNote());

  // Quick note state
  const [noteContent, setNoteContent] = useState("");
  const [convertToNote, setConvertToNote] = useState(false);

  // Highlight state
  const [highlightQuote, setHighlightQuote] = useState("");
  const [highlightAnnotation, setHighlightAnnotation] = useState("");

  // Screenshot state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [screenshotAnnotation, setScreenshotAnnotation] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useDialogFocusTrap({
    dialogRef,
    initialFocusRef: textareaRef,
    onEscape: onClose,
    open,
  });

  // Load last edited note and reset states on open
  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => {
      setLastNote(getLastEditedNote());
      setError(null);
      setSuccessMsg(null);
      textareaRef.current?.focus();
    }, 50);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  // Clean image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  if (!open) return null;

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请选择有效的图片文件。");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError(null);
  };

  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          setTab("screenshot");
          handleImageSelect(file);
          return;
        }
      }
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setTab("screenshot");
      handleImageSelect(files[0]);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (tab === "quick-note") {
        if (!noteContent.trim()) {
          setError("请输入速记内容。");
          setSubmitting(false);
          return;
        }

        if (convertToNote) {
          // Direct create note and open
          const firstLine = noteContent.trim().split("\n")[0] || "未命名笔记";
          const title = firstLine.slice(0, 40).replace(/^[#\s]+/, "");
          const note = await requestJson<{ id: string }>("/api/notes", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              title,
              contentMarkdown: noteContent.trim(),
            }),
          });
          onClose();
          router.push(`/notes/${note.id}`);
          return;
        } else {
          // Save to Inbox
          await requestJson("/api/quick-notes", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ content: noteContent.trim() }),
          });
          setSuccessMsg("已保存至收件箱");
          setNoteContent("");
          setTimeout(() => {
            onClose();
            router.refresh();
          }, 600);
        }
      } else if (tab === "highlight") {
        if (!highlightQuote.trim()) {
          setError("请输入摘录原文。");
          setSubmitting(false);
          return;
        }
        await requestJson("/api/highlights", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            quote: highlightQuote.trim(),
            annotation: highlightAnnotation.trim() || undefined,
          }),
        });
        setSuccessMsg("摘录已保存至收件箱");
        setHighlightQuote("");
        setHighlightAnnotation("");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 600);
      } else if (tab === "screenshot") {
        if (!imageFile) {
          setError("请先选择或粘贴图片。");
          setSubmitting(false);
          return;
        }
        const formData = new FormData();
        formData.append("image", imageFile);
        if (screenshotAnnotation.trim()) {
          formData.append("annotation", screenshotAnnotation.trim());
        }
        await requestJson("/api/screenshots", {
          method: "POST",
          body: formData,
        });
        setSuccessMsg("截图已保存至收件箱");
        setImageFile(null);
        setImagePreview(null);
        setScreenshotAnnotation("");
        setTimeout(() => {
          onClose();
          router.refresh();
        }, 600);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存失败，请重试。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-[var(--glass-border)] bg-[var(--surface)] p-4 sm:p-5 shadow-2xl transition-all animate-in slide-in-from-bottom-6 duration-200"
        onPaste={handlePaste}
        role="dialog"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <CaptureIcon size={16} />
            </span>
            <h2 id={titleId} className="text-sm font-semibold text-[var(--ink)]">
              快速捕捉 · iPad Reading Mode
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            className="flex size-7 items-center justify-center rounded-md text-[var(--ink-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--ink)] cursor-pointer"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Resume Last Note Banner */}
        {lastNote && (
          <div className="mt-3 flex items-center justify-between rounded-lg border border-[var(--accent)]/30 bg-[var(--accent-soft)]/50 px-3 py-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <SparklesIcon size={13} className="text-[var(--accent-strong)] shrink-0" />
              <span className="text-[var(--ink-muted)] shrink-0">继续上次笔记：</span>
              <span className="truncate font-semibold text-[var(--ink)]">{lastNote.title}</span>
            </div>
            <Link
              href={`/notes/${lastNote.id}`}
              onClick={onClose}
              className="shrink-0 ml-2 rounded-md bg-[var(--surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--accent-strong)] shadow-2xs hover:bg-[var(--surface-muted)] cursor-pointer"
            >
              直接进入 &rarr;
            </Link>
          </div>
        )}

        {/* Tabs */}
        <div className="mt-3.5 flex rounded-lg bg-[var(--surface-muted)] p-1 gap-1">
          <button
            type="button"
            onClick={() => setTab("quick-note")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer",
              tab === "quick-note"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-2xs font-semibold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <DocumentIcon size={14} />
            <span>速记</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("highlight")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer",
              tab === "highlight"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-2xs font-semibold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <HighlightIcon size={14} />
            <span>高亮摘录</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("screenshot")}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-all cursor-pointer",
              tab === "screenshot"
                ? "bg-[var(--surface)] text-[var(--ink)] shadow-2xs font-semibold"
                : "text-[var(--ink-muted)] hover:text-[var(--ink)]"
            )}
          >
            <ImageIcon size={14} />
            <span>截图粘贴</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-3.5 flex flex-col gap-3">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              ✓ {successMsg}
            </div>
          )}

          {tab === "quick-note" && (
            <div className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="记录灵感、待办或阅读思考 (支持 Apple Pencil 随手写)..."
                rows={4}
                autoCapitalize="sentences"
                autoCorrect="on"
                spellCheck={true}
                className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <label className="flex items-center gap-2 text-xs text-[var(--ink-muted)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={convertToNote}
                  onChange={(e) => setConvertToNote(e.target.checked)}
                  className="rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                />
                <span>直接开辟为新笔记（否则保存至收件箱）</span>
              </label>
            </div>
          )}

          {tab === "highlight" && (
            <div className="flex flex-col gap-2">
              <textarea
                ref={textareaRef}
                value={highlightQuote}
                onChange={(e) => setHighlightQuote(e.target.value)}
                placeholder="粘贴左侧阅读文章的原文摘录..."
                rows={3}
                className="w-full resize-none rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] font-serif"
              />
              <input
                type="text"
                value={highlightAnnotation}
                onChange={(e) => setHighlightAnnotation(e.target.value)}
                placeholder="想法或批注 (可选)"
                className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          {tab === "screenshot" && (
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageSelect(e.target.files[0]);
                  }
                }}
              />
              {imagePreview ? (
                <div className="relative rounded-lg border border-[var(--line)] overflow-hidden bg-black/5 max-h-48 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Screenshot preview" className="max-h-48 object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 cursor-pointer"
                  >
                    <CloseIcon size={12} />
                  </button>
                </div>
              ) : (
                <div
                  aria-label="选择截图文件，支持拖放和粘贴图片"
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--line)] p-5 text-center hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] cursor-pointer transition-colors"
                >
                  <ImageIcon size={24} className="text-[var(--ink-muted)] mb-1" />
                  <span className="text-xs font-medium text-[var(--ink)]">点击选择或直接粘贴截图 (Cmd+V)</span>
                  <span className="text-[11px] text-[var(--ink-faint)] mt-0.5">支持相册分屏拖入、剪贴板图片</span>
                </div>
              )}
              <input
                type="text"
                value={screenshotAnnotation}
                onChange={(e) => setScreenshotAnnotation(e.target.value)}
                placeholder="截图批注或备注 (可选)"
                className="h-9 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 text-xs text-[var(--ink)] placeholder:text-[var(--ink-faint)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-1 flex items-center justify-end gap-2 pt-2 border-t border-[var(--line)]">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              取消
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? "正在保存..." : (tab === "quick-note" && convertToNote ? "创建并打开笔记" : "保存到收件箱")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

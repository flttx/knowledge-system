"use client";

import { autocompletion, type Completion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { minimalSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n/locales";
import { ImageIcon } from "@/components/icons";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCreateNewNote?: (title: string) => void;
  noteId?: string;
  disabled?: boolean;
}

interface NoteTitleResult {
  id: string;
  title: string;
}

interface NoteTitleResponse {
  items: NoteTitleResult[];
}

interface MarkdownAction {
  label: string;
  visibleLabel?: TranslationKey;
  title: TranslationKey;
  prefix: string;
  suffix?: string;
  placeholder?: string;
  priority?: "primary" | "secondary";
}

const actions: MarkdownAction[] = [
  { label: "B", title: "editor.bold", prefix: "**", suffix: "**", placeholder: "粗体文字", priority: "primary" },
  { label: "I", title: "editor.italic", prefix: "*", suffix: "*", placeholder: "斜体文字", priority: "secondary" },
  { label: "H", title: "editor.heading", prefix: "## ", priority: "secondary" },
  { label: "•", title: "editor.list", prefix: "- ", priority: "primary" },
  { label: "☐", title: "editor.taskList", prefix: "- [ ] ", priority: "secondary" },
  { label: ">", title: "editor.quote", prefix: "> ", priority: "secondary" },
  { label: "Link", visibleLabel: "editor.link", title: "editor.link", prefix: "[", suffix: "](url)", placeholder: "链接文字", priority: "primary" },
  { label: "Code", visibleLabel: "editor.code", title: "editor.code", prefix: "```\n", suffix: "\n```", placeholder: "代码", priority: "secondary" },
  { label: "Table", visibleLabel: "editor.table", title: "editor.table", prefix: "| 标题 | 内容 |\n| --- | --- |\n| ", suffix: " |  |", placeholder: "单元格", priority: "secondary" },
];

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCreateNewNote,
  noteId,
  disabled = false,
}: MarkdownEditorProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onCreateNewNoteRef = useRef(onCreateNewNote);
  const noteIdRef = useRef(noteId);
  const completionAbortRef = useRef<AbortController | null>(null);
  const [bubblePos, setBubblePos] = useState<{ top: number; left: number } | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    onCreateNewNoteRef.current = onCreateNewNote;
    noteIdRef.current = noteId;
  }, [noteId, onChange, onCreateNewNote, onSave]);

  // Upload image file and insert markdown image tag
  const uploadAndInsertImageFile = async (file: File, view: EditorView, insertPos?: number) => {
    if (!file.type.startsWith("image/")) return;
    setUploadingImage(true);

    const pos = insertPos ?? view.state.selection.main.from;
    const placeholder = `\n![正在上传 ${file.name || "图片"}...]()\n`;

    view.dispatch({
      changes: { from: pos, to: pos, insert: placeholder },
      selection: { anchor: pos + placeholder.length },
      userEvent: "input",
    });

    try {
      const formData = new FormData();
      formData.append("image", file);
      if (noteIdRef.current) {
        formData.append("noteId", noteIdRef.current);
      }

      const response = await fetch("/api/screenshots", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("上传失败");
      }

      const data = (await response.json()) as { imageUrl: string };
      const currentDoc = view.state.doc.toString();
      const placeholderIdx = currentDoc.indexOf(placeholder);

      if (placeholderIdx !== -1) {
        const replacement = `\n![${file.name || "图片"}](${data.imageUrl})\n`;
        view.dispatch({
          changes: {
            from: placeholderIdx,
            to: placeholderIdx + placeholder.length,
            insert: replacement,
          },
          selection: { anchor: placeholderIdx + replacement.length },
          userEvent: "input",
        });
      }
    } catch {
      const currentDoc = view.state.doc.toString();
      const placeholderIdx = currentDoc.indexOf(placeholder);
      if (placeholderIdx !== -1) {
        const replacement = `\n> ⚠️ 图片上传失败: ${file.name}\n`;
        view.dispatch({
          changes: {
            from: placeholderIdx,
            to: placeholderIdx + placeholder.length,
            insert: replacement,
          },
          selection: { anchor: placeholderIdx + replacement.length },
          userEvent: "input",
        });
      }
    } finally {
      setUploadingImage(false);
      view.focus();
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialValueRef.current,
      extensions: [
        minimalSetup,
        markdown(),
        keymap.of([
          indentWithTab,
          { key: "Mod-s", run: () => { onSaveRef.current(); return true; } },
        ]),
        autocompletion({
          override: [async (context: CompletionContext): Promise<CompletionResult | null> => {
            const token = context.matchBefore(/\[\[[^\[\]\r\n]*/);
            if (!token || (!context.explicit && token.from === token.to)) return null;

            completionAbortRef.current?.abort();
            const controller = new AbortController();
            completionAbortRef.current = controller;
            const query = token.text.slice(2).trim();
            const params = new URLSearchParams({ limit: "8" });
            if (query) params.set("q", query);

            try {
              const response = await fetch(`/api/notes?${params}`, { signal: controller.signal });
              if (!response.ok) return null;
              const result = (await response.json()) as NoteTitleResponse;
              const options: Completion[] = result.items.map((note) => ({
                label: note.title,
                type: "text",
                apply: `${note.title}]]`,
              }));
              const hasExactMatch = result.items.some((note) => note.title === query);
              if (query && !hasExactMatch && onCreateNewNoteRef.current) {
                options.push({
                  label: `创建新笔记：${query}`,
                  type: "keyword",
                  apply: () => onCreateNewNoteRef.current?.(query),
                });
              }
              return { from: token.from + 2, options };
            } catch (error: unknown) {
              if (error instanceof DOMException && error.name === "AbortError") return null;
              return null;
            }
          }],
        }),
        EditorView.editable.of(!disabled),
        // Apple Pencil Scribble & Mobile Keyboard Optimization
        EditorView.contentAttributes.of({
          autocapitalize: "sentences",
          autocorrect: "on",
          inputmode: "text",
          spellcheck: "true",
        }),
        // Paste and Drop Handlers for Screenshots & Images
        EditorView.domEventHandlers({
          paste(event, view) {
            const items = event.clipboardData?.items;
            if (!items) return false;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith("image/")) {
                const file = items[i].getAsFile();
                if (file) {
                  event.preventDefault();
                  void uploadAndInsertImageFile(file, view);
                  return true;
                }
              }
            }
            return false;
          },
          drop(event, view) {
            const files = event.dataTransfer?.files;
            if (!files || files.length === 0) return false;
            const imageFile = Array.from(files).find((f) => f.type.startsWith("image/"));
            if (imageFile) {
              event.preventDefault();
              const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? view.state.selection.main.from;
              void uploadAndInsertImageFile(imageFile, view, pos);
              return true;
            }
            return false;
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }

          // Check selection for Floating Bubble Menu
          if (update.selectionSet || update.docChanged) {
            const { from, to } = update.state.selection.main;
            if (from !== to && update.view.hasFocus) {
              const coords = update.view.coordsAtPos(from);
              const containerRect = containerRef.current?.getBoundingClientRect();
              if (coords && containerRect) {
                setBubblePos({
                  top: Math.max(8, coords.top - containerRect.top - 42),
                  left: Math.max(10, Math.min(containerRect.width - 240, coords.left - containerRect.left)),
                });
                return;
              }
            }
            setBubblePos(null);
          }
        }),
      ],
    });
    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;

    return () => {
      completionAbortRef.current?.abort();
      view.destroy();
      viewRef.current = null;
    };
  }, [disabled]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }, [value]);

  function applyAction(action: MarkdownAction): void {
    const view = viewRef.current;
    if (!view || disabled) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const replacement = `${action.prefix}${selected || action.placeholder || ""}${action.suffix || ""}`;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + replacement.length },
      userEvent: "input",
    });
    view.focus();
  }

  function applyWikilink(): void {
    const view = viewRef.current;
    if (!view || disabled) return;
    const { from, to } = view.state.selection.main;
    const selected = view.state.sliceDoc(from, to);
    const replacement = `[[${selected || "页面标题"}]]`;
    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + replacement.length },
      userEvent: "input",
    });
    view.focus();
  }

  const handleImagePickerChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && viewRef.current) {
      void uploadAndInsertImageFile(e.target.files[0], viewRef.current);
      e.target.value = "";
    }
  };

  return (
    <div className="editor-surface relative w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImagePickerChange}
      />

      {/* Responsive Single-Row Minimalist / iPad Friendly Toolbar */}
      <div
        className="editor-toolbar flex items-center justify-between border-b border-[var(--line)] bg-[var(--surface-muted)]/60 px-2 py-1 backdrop-blur-xs font-mono select-none"
        aria-label={t("editor.toolbar")}
      >
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {/* Add Image / Screenshot */}
          <Button
            aria-label="插入图片"
            size="sm"
            className="h-6.5 min-w-[26px] px-1.5 text-[11px] font-medium text-[var(--accent-strong)] hover:bg-[var(--accent-soft)] rounded-md transition-all cursor-pointer shrink-0"
            disabled={disabled || uploadingImage}
            onClick={() => fileInputRef.current?.click()}
            title="插入或粘贴图片/截图"
            variant="ghost"
          >
            <ImageIcon size={13} className="mr-0.5" />
            <span className="text-[10px]">{uploadingImage ? "上传中" : "图片"}</span>
          </Button>

          {/* Quick Wikilink */}
          <Button
            aria-label="双链引用"
            size="sm"
            className="h-6.5 min-w-[26px] px-2 text-[11px] font-semibold text-[var(--accent-strong)] hover:bg-[var(--accent-soft)] rounded-md transition-all cursor-pointer shrink-0"
            disabled={disabled}
            onClick={applyWikilink}
            title="双向链接 [[]]"
            variant="ghost"
          >
            [[]]
          </Button>

          <span className="mx-0.5 h-3.5 w-px bg-[var(--line)] shrink-0" aria-hidden="true" />

          {/* Primary Quick Actions */}
          {actions
            .filter((a) => showAllTools || a.priority === "primary")
            .map((action) => (
              <Button
                key={action.title}
                aria-label={t(action.title)}
                size="sm"
                className="h-6.5 min-w-[26px] px-2 text-[11px] font-medium text-[var(--ink-soft)] hover:bg-[var(--surface)] hover:text-[var(--ink)] hover:shadow-2xs rounded-md transition-all cursor-pointer shrink-0"
                disabled={disabled}
                onClick={() => applyAction(action)}
                title={t(action.title)}
                variant="ghost"
              >
                {action.visibleLabel ? t(action.visibleLabel) : action.label}
              </Button>
            ))}
        </div>

        {/* Toggle Expand / Minimalist Mode Button */}
        <button
          type="button"
          onClick={() => setShowAllTools((prev) => !prev)}
          className="flex h-6.5 items-center justify-center rounded-md px-1.5 text-[11px] text-[var(--ink-muted)] hover:bg-[var(--surface)] hover:text-[var(--ink)] transition-colors cursor-pointer shrink-0 ml-1"
          title={showAllTools ? "精简工具栏" : "展开全部格式工具"}
        >
          {showAllTools ? "收起" : "•••"}
        </button>
      </div>

      {/* Floating Selection Bubble Menu (Apple Pencil / Touch Selection In-place Formatting) */}
      {bubblePos && !disabled ? (
        <div
          className="absolute z-20 flex items-center gap-1 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] p-1 backdrop-blur-md shadow-xl animate-in fade-in zoom-in-95"
          style={{ top: `${bubblePos.top}px`, left: `${bubblePos.left}px` }}
        >
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded-full text-xs font-bold text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
            onClick={() => applyAction({ label: "B", title: "editor.bold", prefix: "**", suffix: "**" })}
            title={t("editor.bold")}
          >
            B
          </button>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded-full text-xs italic font-semibold text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
            onClick={() => applyAction({ label: "I", title: "editor.italic", prefix: "*", suffix: "*" })}
            title={t("editor.italic")}
          >
            i
          </button>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded-full text-xs font-mono text-[var(--ink)] hover:bg-[var(--surface-muted)] transition-colors cursor-pointer"
            onClick={() => applyAction({ label: "Code", title: "editor.code", prefix: "`", suffix: "`" })}
            title={t("editor.code")}
          >
            &lt;&gt;
          </button>
          <span className="h-3 w-px bg-[var(--line)]" />
          <button
            type="button"
            className="flex h-6 items-center justify-center rounded-full px-2 text-[11px] font-semibold text-[var(--accent-strong)] hover:bg-[var(--accent-soft)] transition-colors cursor-pointer"
            onClick={applyWikilink}
            title={t("editor.link")}
          >
            [[]] {t("editor.link")}
          </button>
        </div>
      ) : null}

      <div ref={containerRef} className="markdown-editor min-h-[28rem] w-full" />
    </div>
  );
}

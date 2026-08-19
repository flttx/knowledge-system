"use client";

import { autocompletion, type Completion, type CompletionContext, type CompletionResult } from "@codemirror/autocomplete";
import { minimalSetup } from "codemirror";
import { indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/locale-provider";
import type { TranslationKey } from "@/lib/i18n/locales";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCreateNewNote?: (title: string) => void;
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
  title: TranslationKey;
  prefix: string;
  suffix?: string;
  placeholder?: string;
}

const actions: MarkdownAction[] = [
  { label: "H", title: "editor.heading", prefix: "## " },
  { label: "B", title: "editor.bold", prefix: "**", suffix: "**", placeholder: "text" },
  { label: "I", title: "editor.italic", prefix: "*", suffix: "*", placeholder: "text" },
  { label: "•", title: "editor.list", prefix: "- " },
  { label: "☐", title: "editor.taskList", prefix: "- [ ] " },
  { label: ">", title: "editor.quote", prefix: "> " },
  { label: "Link", title: "editor.link", prefix: "[", suffix: "](url)", placeholder: "text" },
  { label: "Code", title: "editor.code", prefix: "```\n", suffix: "\n```", placeholder: "code" },
  { label: "Table", title: "editor.table", prefix: "| heading | content |\n| --- | --- |\n| ", suffix: " |  |", placeholder: "cell" },
  { label: "Image", title: "editor.image", prefix: "![", suffix: "](image-url)", placeholder: "alt text" },
];

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  onCreateNewNote,
  disabled = false,
}: MarkdownEditorProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  const onCreateNewNoteRef = useRef(onCreateNewNote);
  const completionAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
    onSaveRef.current = onSave;
    onCreateNewNoteRef.current = onCreateNewNote;
  }, [onChange, onCreateNewNote, onSave]);

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
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
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

  return (
    <div className="editor-surface">
      <div className="flex flex-wrap gap-1 border-b border-[var(--line)] py-2" aria-label={t("editor.toolbar")}>
        {actions.map((action) => (
          <Button
            key={action.title}
            aria-label={t(action.title)}
            className="min-h-8 rounded-md px-2 text-xs"
            disabled={disabled}
            onClick={() => applyAction(action)}
            title={t(action.title)}
            variant="ghost"
          >
            {action.label}
          </Button>
        ))}
      </div>
      <div ref={containerRef} className="markdown-editor min-h-[28rem]" />
    </div>
  );
}

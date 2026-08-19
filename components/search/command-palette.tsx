"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import type { TitleSearchResult } from "@/lib/search/types";
import { useI18n } from "@/components/i18n/locale-provider";

interface TitleSearchResponse {
  items: TitleSearchResult[];
}

interface ApiErrorPayload {
  error?: { message?: string };
}

export function CommandPalette() {
  const { t } = useI18n();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<TitleSearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleShortcut(event: globalThis.KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const value = query.trim();
    if (!value) return;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void fetch(`/api/search/titles?q=${encodeURIComponent(value)}&limit=8`, { signal: controller.signal })
        .then(async (response) => {
          const body = (await response.json()) as TitleSearchResponse | ApiErrorPayload;
          if (!response.ok) throw new Error((body as ApiErrorPayload).error?.message ?? t("search.error"));
          setItems((body as TitleSearchResponse).items);
          setSelectedIndex(0);
        })
        .catch((fetchError: unknown) => {
          if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
          setItems([]);
          setError(fetchError instanceof Error ? fetchError.message : t("search.error"));
        });
    }, 120);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [open, query, t]);

  function close(): void {
    setOpen(false);
    setQuery("");
    setItems([]);
    setError(null);
  }

  function select(item: TitleSearchResult): void {
    close();
    router.push(`/notes/${item.id}`);
  }

  function handleQueryChange(value: string): void {
    setQuery(value);
    if (!value.trim()) {
      setItems([]);
      setSelectedIndex(0);
      setError(null);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => items.length === 0 ? 0 : (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => items.length === 0 ? 0 : (index - 1 + items.length) % items.length);
    } else if (event.key === "Enter" && items[selectedIndex]) {
      event.preventDefault();
      select(items[selectedIndex]);
    }
  }

  if (!open) return null;

  return (
    <div className="command-palette-backdrop fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]" onMouseDown={close}>
      <div aria-label={t("search.command")} aria-modal="true" className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} role="dialog">
        <label className="sr-only" htmlFor="command-palette-search">{t("search.command")}</label>
        <input
          aria-controls="command-palette-results"
          autoComplete="off"
          className="min-h-14 w-full border-b border-[var(--line)] px-5 text-base outline-none"
          id="command-palette-search"
          onChange={(event) => handleQueryChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("search.command")}
          ref={inputRef}
          value={query}
        />
        {error ? <p className="px-5 py-4 text-sm text-[var(--danger)]" role="alert">{error}</p> : null}
        {!error && query.trim() && items.length === 0 ? <p className="px-5 py-4 text-sm text-[var(--ink-muted)]">{t("search.commandEmpty")}</p> : null}
        <ul id="command-palette-results" role="listbox" aria-label={t("search.command")}>
          {items.map((item, index) => (
            <li key={item.id}>
              <button
                aria-selected={index === selectedIndex}
                className={`w-full px-5 py-3 text-left ${index === selectedIndex ? "bg-[var(--surface-muted)]" : "hover:bg-[var(--surface-muted)]"}`}
                onClick={() => select(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                type="button"
              >
                <span className="block truncate font-semibold text-[var(--ink)]">{item.title}</span>
                {item.tags.length > 0 ? <span className="mt-1 block truncate text-xs text-[var(--ink-muted)]">{item.tags.join(" · ")}</span> : null}
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-[var(--line)] px-5 py-3 text-xs text-[var(--ink-faint)]">{t("search.commandHint")}</p>
      </div>
    </div>
  );
}

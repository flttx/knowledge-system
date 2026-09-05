"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { requestJson } from "@/lib/api/client";

export function useListParams() {
  const search = useSearchParams();
  const pathname = usePathname();
  const update = useCallback((values: Record<string, string>) => {
    const next = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    window.history.replaceState(null, "", `${pathname}${next.size ? `?${next}` : ""}`);
  }, [pathname]);
  return { params: search, update, currentUrl: `${pathname}${search.size ? `?${search}` : ""}` };
}

interface Page<T> { items: T[]; nextCursor: string | null }
interface Snapshot<T> extends Page<T> { pages: number; scroll: number }
// Session memory only: no private list content is persisted to disk.
const snapshots = new Map<string, Snapshot<unknown>>();
export function clearListSnapshots() { snapshots.clear(); }
export function usePagedList<T extends { id: string; type?: string }>(url: string, restore = true) {
  const [state, setState] = useState<Snapshot<T>>({ items: [], nextCursor: null, pages: 1, scroll: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const stateRef = useRef(state);
  const currentUrl = useRef(url);
  const run = useCallback(async (more = false) => {
    controller.current?.abort();
    const active = new AbortController(); controller.current = active;
    setLoading(true); setError(null);
    try {
      const old = stateRef.current;
      if (more && !old.nextCursor) return;
      const cursor = more ? old.nextCursor : null;
      const page: Page<T> = await requestJson(`${url}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, { signal: active.signal });
      if (active.signal.aborted) return;
      const unique = new Map((more ? old.items : []).map(item => [`${item.type ?? ""}:${item.id}`, item]));
      for (const item of page.items) unique.set(`${item.type ?? ""}:${item.id}`, item);
      const next = { items: [...unique.values()], nextCursor: page.nextCursor, pages: more ? old.pages + 1 : 1, scroll: old.scroll };
      stateRef.current = next; setState(next);
      if (restore) snapshots.set(url, next);
    } catch (err) {
      if (!active.signal.aborted) setError(err instanceof Error ? err.message : "Request failed");
    } finally { if (!active.signal.aborted) setLoading(false); }
  }, [url, restore]);
  useEffect(() => {
    currentUrl.current = url;
    const cached = restore ? snapshots.get(url) as Snapshot<T> | undefined : undefined;
    const initial = cached ?? { items: [], nextCursor: null, pages: 1, scroll: 0 };
    stateRef.current = initial;
    const timer = window.setTimeout(() => {
      setError(null);
      setLoading(!cached);
      setState(initial);
      if (cached) {
        setLoading(false);
        if (currentUrl.current === url) requestAnimationFrame(() => window.scrollTo(0, cached.scroll));
      } else {
        void run();
      }
    }, 150);
    return () => {
      window.clearTimeout(timer); controller.current?.abort();
      if (restore && stateRef.current.items.length) snapshots.set(url, { ...stateRef.current, scroll: window.scrollY });
    };
  }, [url, run, restore]);
  return { ...state, loading, error, reload: () => run(), loadMore: () => run(true) };
}

"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<unknown>>();
const listeners = new Set<() => void>();

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export interface UseSwrQueryOptions<T> {
  enabled?: boolean;
  ttlMs?: number;
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseSwrQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  mutate: (updater?: T | ((prev: T | null) => T | null), revalidate?: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSwrQuery<T>(
  url: string | null,
  options: UseSwrQueryOptions<T> = {},
): UseSwrQueryResult<T> {
  const { enabled = true, ttlMs = 30000, initialData } = options;

  // Subscribe to in-memory store via React's official useSyncExternalStore
  const cachedData = useSyncExternalStore<T | null>(
    subscribe,
    () => {
      if (!url) return initialData ?? null;
      const entry = queryCache.get(url) as CacheEntry<T> | undefined;
      return entry ? entry.data : (initialData ?? null);
    },
    () => initialData ?? null,
  );

  const fetchData = useCallback(
    async (isBackground = false): Promise<void> => {
      if (!url || !enabled) return;

      const controller = new AbortController();
      try {
        const response = await fetch(url, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | T
          | { error?: { message?: string } }
          | null;

        if (!response.ok) {
          const message =
            (body as { error?: { message?: string } })?.error?.message ??
            "请求失败，请稍后重试。";
          throw new Error(message);
        }

        const freshData = body as T;
        queryCache.set(url, { data: freshData, timestamp: Date.now() });
        notifyListeners();
        options.onSuccess?.(freshData);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const errMessage = err instanceof Error ? err.message : "请求失败";
        if (!isBackground) {
          options.onError?.(err instanceof Error ? err : new Error(errMessage));
        }
      }
    },
    [enabled, options, url],
  );

  useEffect(() => {
    if (!enabled || !url) return;

    const entry = queryCache.get(url);
    if (!entry) {
      void fetchData(false);
    } else {
      const isFresh = Date.now() - entry.timestamp < ttlMs;
      if (!isFresh) {
        void fetchData(true);
      }
    }
  }, [enabled, fetchData, ttlMs, url]);

  const mutate = useCallback(
    async (
      updater?: T | ((prev: T | null) => T | null),
      revalidate = true,
    ): Promise<void> => {
      if (!url) return;
      if (updater !== undefined) {
        const current = (queryCache.get(url)?.data as T | undefined) ?? null;
        const next = typeof updater === "function" ? (updater as (p: T | null) => T | null)(current) : updater;
        if (next !== null && next !== undefined) {
          queryCache.set(url, { data: next, timestamp: Date.now() });
        } else {
          queryCache.delete(url);
        }
        notifyListeners();
      }
      if (revalidate) {
        await fetchData(true);
      }
    },
    [fetchData, url],
  );

  const loading = enabled && !!url && !queryCache.has(url) && cachedData === null;

  return {
    data: cachedData,
    loading,
    error: null,
    mutate,
    refetch: () => fetchData(false),
  };
}

export function invalidateQueryCache(urlPrefix?: string): void {
  if (!urlPrefix) {
    queryCache.clear();
    notifyListeners();
    return;
  }
  for (const key of queryCache.keys()) {
    if (key.startsWith(urlPrefix)) {
      queryCache.delete(key);
    }
  }
  notifyListeners();
}

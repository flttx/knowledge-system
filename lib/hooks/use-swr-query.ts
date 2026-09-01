"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface RequestState {
  key: string;
  loading: boolean;
  error: string | null;
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
  const { onError, onSuccess } = options;
  const requestKey = `${url ?? ""}|${enabled}|${initialData === undefined ? "no-initial" : "initial"}`;

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

  const [requestState, setRequestState] = useState<RequestState>(() => ({
    key: requestKey,
    loading: enabled && !!url && !queryCache.has(url) && initialData === undefined,
    error: null,
  }));
  const controllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(
    async (isBackground = false): Promise<void> => {
      if (!url || !enabled) return;

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setRequestState({
        key: requestKey,
        loading: !isBackground && !queryCache.has(url),
        error: null,
      });

      try {
        const response = await fetch(url, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as
          | T
          | { error?: { message?: string } }
          | null;
        if (controllerRef.current !== controller) return;

        if (!response.ok) {
          const message =
            (body as { error?: { message?: string } })?.error?.message ??
            "请求失败，请稍后重试。";
          throw new Error(message);
        }

        const freshData = body as T;
        queryCache.set(url, { data: freshData, timestamp: Date.now() });
        notifyListeners();
        setRequestState({ key: requestKey, loading: false, error: null });
        onSuccess?.(freshData);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (controllerRef.current !== controller) return;
        const errMessage = err instanceof Error ? err.message : "请求失败";
        setRequestState({ key: requestKey, loading: false, error: errMessage });
        if (!isBackground) {
          onError?.(err instanceof Error ? err : new Error(errMessage));
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
      }
    },
    [enabled, onError, onSuccess, requestKey, url],
  );

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [requestKey]);

  useEffect(() => {
    if (!enabled || !url) return;

    const entry = queryCache.get(url);
    let timeoutId: number | null = null;
    if (!entry) {
      timeoutId = window.setTimeout(() => void fetchData(false), 0);
    } else {
      const isFresh = Date.now() - entry.timestamp < ttlMs;
      if (!isFresh) {
        timeoutId = window.setTimeout(() => void fetchData(true), 0);
      }
    }
    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
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

  const currentRequestState = requestState.key === requestKey
    ? requestState
    : {
        key: requestKey,
        loading: enabled && !!url && !queryCache.has(url) && initialData === undefined,
        error: null,
      };
  const loading = enabled && !!url && !queryCache.has(url) && cachedData === null;
  return {
    data: cachedData,
    loading: currentRequestState.loading || (loading && currentRequestState.error === null),
    error: currentRequestState.error,
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

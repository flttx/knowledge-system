"use client";

import { useSyncExternalStore } from "react";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  } else if (typeof (mediaQuery as { addListener?: (cb: () => void) => void }).addListener === "function") {
    (mediaQuery as { addListener: (cb: () => void) => void }).addListener(callback);
    return () => {
      (mediaQuery as { removeListener: (cb: () => void) => void }).removeListener(callback);
    };
  }
  return () => {};
}

export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    getPrefersReducedMotion,
    () => false,
  );
}

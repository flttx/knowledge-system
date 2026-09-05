export function safeReturnTo(value: string | null | undefined, fallback = "/notes"): string {
  if (!value || /[\\\s\u0000-\u001f]/.test(value) || !/^\/(home|notes|library|inbox|search|graph)(\/|\?|$)/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://knowledge.invalid");
    if (url.origin !== "https://knowledge.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

export function withReturnTo(href: string, from: string): string {
  return `${href}${href.includes("?") ? "&" : "?"}returnTo=${encodeURIComponent(safeReturnTo(from, "/home"))}`;
}

export function inboxItemHref(type: string, id: string): string {
  return `/inbox?itemType=${encodeURIComponent(type)}&itemId=${encodeURIComponent(id)}`;
}

export function validCaptureImage(file: { type: string; size: number }): boolean {
  return ["image/png", "image/jpeg", "image/webp"].includes(file.type) && file.size > 0 && file.size <= 10 * 1024 * 1024;
}

export function highlightPayload(text: string, personalComment: string, sourceId?: string) {
  return { text: text.trim(), personalComment: personalComment.trim() || undefined, sourceId: sourceId || undefined };
}

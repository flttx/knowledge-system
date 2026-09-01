export function isSafeHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;

  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeTagName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase();
}

export function slugFromTitle(title: string): string {
  const slug = title
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/gu, "-")
    .replace(/[^\p{L}\p{N}_-]+/gu, "")
    .replace(/-+/gu, "-")
    .replace(/^-|-$/gu, "");

  return slug || "note";
}

export function makeExcerpt(markdown: string, maxLength = 160): string {
  const excerpt = markdown.replace(/\s+/gu, " ").trim();
  if (excerpt.length <= maxLength) {
    return excerpt;
  }

  return `${excerpt.slice(0, maxLength - 1).trimEnd()}…`;
}

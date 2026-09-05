export function normalizeTagName(name: string): string {
  return name.normalize("NFKC").trim().toLocaleLowerCase();
}

export function makeMarkdownPreview(markdown: string, maxLength = 640): string {
  const normalized = markdown.replace(/\r\n?/gu, "\n").trim();
  if (normalized.length <= maxLength) return normalized;

  const paragraphBoundary = normalized.lastIndexOf("\n\n", maxLength);
  const lineBoundary = normalized.lastIndexOf("\n", maxLength);
  const boundary = paragraphBoundary >= Math.floor(maxLength * 0.55)
    ? paragraphBoundary
    : lineBoundary;
  const preview = normalized.slice(0, Math.max(boundary, maxLength)).trimEnd();
  const openCodeFence = (preview.match(/^```/gmu) ?? []).length % 2 === 1;

  return `${preview}${openCodeFence ? "\n```" : ""}\n\n…`;
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
  if (!markdown) return "";
  const cleaned = markdown
    // Unescape literal \n or \r if stored as text
    .replace(/\\n|\\r|\\t/gu, " ")
    // Remove fenced code blocks
    .replace(/```[\s\S]*?```/gu, " ")
    // Remove inline code
    .replace(/`([^`]+)`/gu, "$1")
    // Remove markdown table header separator rows (|---|---|)
    .replace(/\|(?:\s*:?-+:?\s*\|)+/gu, " ")
    // Replace table cell separators with spaces
    .replace(/\|/gu, " ")
    // Replace markdown images ![alt](url) -> alt
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
    // Replace markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    // Replace wikilinks [[target|label]] or [[target]] -> label or target
    .replace(/\[\[([^|\]\r\n]+)(?:\|([^\]\r\n]+))?\]\]/gu, (_match, target, label) => label || target)
    // Remove headers (# Title)
    .replace(/^#{1,6}\s+/gmu, "")
    // Remove list markers (- , * , 1. , [ ] )
    .replace(/^[\s>*-+]+(?:\d+\.)?\s*(?:\[[ xX]\]\s*)?/gmu, "")
    // Remove bold, italic, strikethrough delimiters (*, _, ~)
    .replace(/[*_~]{1,3}/gu, "")
    // Remove HTML entities & tags
    .replace(/&[a-zA-Z0-9#]+;/gu, " ")
    .replace(/<[^>]+>/gu, " ")
    // Collapse all whitespace
    .replace(/\s+/gu, " ")
    .trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trimEnd()}…`;
}

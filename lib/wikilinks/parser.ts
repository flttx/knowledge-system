export interface ParsedWikilink {
  targetTitle: string;
  alias?: string;
  start: number;
  end: number;
}

const wikilinkPattern = /\[\[([^\[\]\r\n]+?)\]\]/g;

export function parseWikilinks(markdown: string): ParsedWikilink[] {
  const links: ParsedWikilink[] = [];
  let match: RegExpExecArray | null;

  while ((match = wikilinkPattern.exec(markdown)) !== null) {
    const inner = match[1];
    const separator = inner.indexOf("|");
    const rawTarget = separator === -1 ? inner : inner.slice(0, separator);
    const targetTitle = rawTarget.trim();

    if (!targetTitle) continue;

    if (separator === -1) {
      links.push({
        targetTitle,
        start: match.index,
        end: match.index + match[0].length,
      });
      continue;
    }

    const alias = inner.slice(separator + 1);
    if (!alias.trim()) continue;

    links.push({
      targetTitle,
      alias,
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return links;
}

import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({
  markdown,
  className = "",
}: {
  markdown: string;
  className?: string;
}) {
  if (!markdown.trim()) {
    return null;
  }

  return (
    <div className={`markdown-preview ${className}`.trim()}>
      <ReactMarkdown
        rehypePlugins={[rehypeSanitize]}
        remarkPlugins={[remarkGfm, remarkBreaks]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

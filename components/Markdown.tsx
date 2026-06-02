import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Rich-text renderer for journal posts.
 *
 * Parses Markdown (GitHub-flavored) into semantic HTML. All visual styling
 * lives in the `.prose-editorial` rules in globals.css, so the output stays
 * a clean reading surface. Swap this for an MDX pipeline later if posts
 * need embedded components — the call sites won't change.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-editorial">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}

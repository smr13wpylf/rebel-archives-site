import Link from "next/link";
import type { PostMeta } from "@/lib/posts";
import { formatDate } from "@/lib/format";
import { Pill } from "./Pill";
import { cn } from "@/lib/cn";

/**
 * Editorial card for journal posts.
 *
 * - `feature` renders a larger, lead treatment
 * - `compact` is a horizontal row for archive lists
 * - default is a vertical card for grids
 */
export function EditorialCard({
  post,
  variant = "default",
}: {
  post: PostMeta;
  variant?: "default" | "feature" | "compact";
}) {
  const href = `/writing/${post.slug}`;

  if (variant === "compact") {
    return (
      <article className="group">
        <Link href={href} className="grid gap-4 py-8 sm:grid-cols-[10rem_1fr] sm:gap-8">
          <div className="flex flex-col gap-2">
            <Pill tone="muted" className="px-0">
              {post.category}
            </Pill>
            <time className="text-meta text-taupe" dateTime={post.date}>
              {formatDate(post.date)}
            </time>
          </div>
          <div>
            <h3 className="text-h3 text-ink transition-colors duration-300 group-hover:text-fig">
              {post.title}
            </h3>
            <p className="mt-3 max-w-2xl text-body text-charcoal">{post.excerpt}</p>
            <span className="mt-4 inline-block text-meta uppercase tracking-label text-taupe">
              {post.readingTime} min read
            </span>
          </div>
        </Link>
      </article>
    );
  }

  const isFeature = variant === "feature";

  return (
    <article className="group">
      <Link href={href} className="block">
        <div
          className={cn(
            "mb-5 flex items-center gap-3",
            isFeature && "mb-6",
          )}
        >
          <Pill>{post.category}</Pill>
          <span className="text-meta text-taupe">{post.readingTime} min</span>
        </div>
        <h3
          className={cn(
            "text-ink transition-colors duration-300 group-hover:text-fig text-balance",
            isFeature ? "text-h1" : "text-h3",
          )}
        >
          {post.title}
        </h3>
        <p
          className={cn(
            "mt-4 text-charcoal",
            isFeature ? "max-w-2xl text-lede" : "text-body",
          )}
        >
          {post.excerpt}
        </p>
        <div className="mt-6 flex items-center gap-3 text-meta text-taupe">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span className="link-underline">Read</span>
        </div>
      </Link>
    </article>
  );
}

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

// Re-export the pure formatter so server callers can keep importing it
// from here, while client components import directly from lib/format.
export { formatDate } from "./format";

/**
 * Journal content layer.
 *
 * Posts live as Markdown files in /content/journal. Each file's name is its
 * URL slug (e.g. `reinvention-is-not-escape.md` -> /writing/reinvention-is-not-escape).
 * Frontmatter drives metadata; the Markdown body is rendered by
 * components/Markdown.tsx.
 *
 * To add a post: drop a new .md file in /content/journal with the
 * frontmatter shape below. No code changes required.
 */

const POSTS_DIR = path.join(process.cwd(), "content", "journal");

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string; // ISO: YYYY-MM-DD
  readingTime: number; // minutes
  featured?: boolean;
  author?: string;
};

export type Post = PostMeta & {
  content: string;
};

const WORDS_PER_MINUTE = 220;

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

function readPostFile(fileName: string): Post {
  const slug = fileName.replace(/\.md$/, "");
  const fullPath = path.join(POSTS_DIR, fileName);
  const raw = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug,
    excerpt: data.excerpt ?? "",
    category: data.category ?? "Essays",
    date: data.date ? new Date(data.date).toISOString().slice(0, 10) : "",
    readingTime: data.readingTime ?? estimateReadingTime(content),
    featured: data.featured ?? false,
    author: data.author ?? "Shayly McDonnell",
    content,
  };
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map(readPostFile)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllPostMeta(): PostMeta[] {
  return getAllPosts().map(({ content: _content, ...meta }) => meta);
}

export function getPostBySlug(slug: string): Post | undefined {
  try {
    return readPostFile(`${slug}.md`);
  } catch {
    return undefined;
  }
}

export function getFeaturedPosts(limit = 3): PostMeta[] {
  const all = getAllPostMeta();
  const featured = all.filter((p) => p.featured);
  const pool = featured.length > 0 ? featured : all;
  return pool.slice(0, limit);
}

export function getCategories(): string[] {
  const set = new Set(getAllPostMeta().map((p) => p.category));
  return Array.from(set).sort();
}

/** Adjacent posts for prev/next navigation (sorted newest-first). */
export function getAdjacentPosts(slug: string): {
  prev?: PostMeta;
  next?: PostMeta;
} {
  const all = getAllPostMeta();
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return {};
  return {
    // "next" = newer, "prev" = older, relative to reading order.
    next: index > 0 ? all[index - 1] : undefined,
    prev: index < all.length - 1 ? all[index + 1] : undefined,
  };
}

/** Related posts: same category first, then most recent others. */
export function getRelatedPosts(slug: string, limit = 2): PostMeta[] {
  const all = getAllPostMeta();
  const current = all.find((p) => p.slug === slug);
  if (!current) return [];
  const sameCategory = all.filter(
    (p) => p.slug !== slug && p.category === current.category,
  );
  const others = all.filter(
    (p) => p.slug !== slug && p.category !== current.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}


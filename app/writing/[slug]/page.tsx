import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Pill } from "@/components/Pill";
import { Markdown } from "@/components/Markdown";
import { EditorialCard } from "@/components/EditorialCard";
import { NewsletterForm } from "@/components/Newsletter";
import { site } from "@/lib/site";
import {
  getAllPostMeta,
  getPostBySlug,
  getAdjacentPosts,
  getRelatedPosts,
  formatDate,
} from "@/lib/posts";

type Params = { slug: string };

export function generateStaticParams() {
  return getAllPostMeta().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors: [post.author ?? site.founder],
      url: `${site.url}/writing/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const { prev, next } = getAdjacentPosts(slug);
  const related = getRelatedPosts(slug, 2);

  // Article structured data for SEO.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: { "@type": "Person", name: post.author ?? site.founder },
    publisher: { "@type": "Organization", name: site.name },
    articleSection: post.category,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Post header */}
      <header className="border-b border-line bg-bone pt-40 pb-14 sm:pb-16">
        <Container width="prose">
          <Reveal>
            <Link
              href="/writing"
              className="link-underline text-meta uppercase tracking-label text-taupe hover:text-ink"
            >
              &larr; The Journal
            </Link>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-8 flex items-center gap-3">
              <Pill>{post.category}</Pill>
            </div>
            <h1 className="mt-5 text-h1 text-ink text-balance">{post.title}</h1>
            <p className="mt-6 text-lede text-charcoal">{post.excerpt}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-meta uppercase tracking-label text-taupe">
              <span>{post.author}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingTime} min read</span>
            </div>
          </Reveal>
        </Container>
      </header>

      {/* Body */}
      <Container width="prose" className="py-section-sm">
        <Reveal>
          <Markdown>{post.content}</Markdown>
        </Reveal>

        {/* Author block */}
        <div className="mt-16 flex flex-col gap-5 border-t border-line pt-10 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-line bg-stone/50">
            <span className="font-serif text-xl italic text-taupe">SM</span>
          </div>
          <div>
            <p className="font-serif text-h3 text-ink">{post.author}</p>
            <p className="mt-2 max-w-lg text-body text-charcoal">
              Writer and archival researcher. Founder of Soul Blueprint, where she reads
              the systems we use to understand ourselves &mdash; closely, and without the
              perfume.{" "}
              <Link href="/about" className="link-underline text-fig">
                More about the work
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Share (understated placeholders) */}
        <div className="mt-10 flex items-center gap-4 text-meta uppercase tracking-label text-taupe">
          <span>Share</span>
          <span aria-hidden className="h-px w-8 bg-line" />
          <a href="#" className="link-underline hover:text-ink">
            Copy link
          </a>
          <a href="#" className="link-underline hover:text-ink">
            Bluesky
          </a>
          <a href="#" className="link-underline hover:text-ink">
            Email
          </a>
        </div>
      </Container>

      {/* Prev / next */}
      {(prev || next) && (
        <Section tone="parchment" spacing="sm">
          <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
            <PrevNext post={prev} label="Older" />
            <PrevNext post={next} label="Newer" align="right" />
          </div>
        </Section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <Section>
          <p className="label mb-10">Keep reading</p>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            {related.map((p) => (
              <EditorialCard key={p.slug} post={p} />
            ))}
          </div>
        </Section>
      )}

      {/* Newsletter near the end */}
      <Section tone="ink" width="prose">
        <Reveal>
          <p className="label text-gold">If this resonated</p>
          <h2 className="mt-5 text-h2 text-bone text-balance">
            Get the next piece when it&rsquo;s worth your attention.
          </h2>
          <p className="mt-4 text-body text-bone/70">
            No schedule, no noise &mdash; just the writing, sent when there&rsquo;s
            something worth saying.
          </p>
        </Reveal>
        <Reveal
          delay={120}
          className="mt-8 [&_label]:text-bone/60 [&_input]:border-bone/25 [&_input]:text-bone [&_p]:text-bone/50"
        >
          <NewsletterForm />
        </Reveal>
      </Section>
    </article>
  );
}

function PrevNext({
  post,
  label,
  align = "left",
}: {
  post?: ReturnType<typeof getAdjacentPosts>["prev"];
  label: string;
  align?: "left" | "right";
}) {
  if (!post) {
    return <div className="hidden bg-parchment sm:block" />;
  }
  return (
    <Link
      href={`/writing/${post.slug}`}
      className={`group flex flex-col gap-3 bg-parchment p-8 transition-colors hover:bg-bone lg:p-10 ${
        align === "right" ? "sm:items-end sm:text-right" : ""
      }`}
    >
      <span className="text-meta uppercase tracking-label text-taupe">{label}</span>
      <span className="font-serif text-h3 text-ink transition-colors group-hover:text-fig">
        {post.title}
      </span>
    </Link>
  );
}

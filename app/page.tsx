import Link from "next/link";
import { Hero } from "@/components/Hero";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { EditorialCard } from "@/components/EditorialCard";
import { OfferingCard } from "@/components/OfferingCard";
import { NewsletterSection } from "@/components/NewsletterSection";
import { Quote } from "@/components/Quote";
import { getFeaturedPosts } from "@/lib/posts";
import { offerings } from "@/lib/offerings";

const pathways = [
  {
    title: "Writing",
    href: "/writing",
    body: "Essays, cultural analysis, and dispatches on identity, meaning, and the patterns underneath a life in transition.",
    cta: "Read the Journal",
  },
  {
    title: "Private Work",
    href: "/work-with-me",
    body: "One-on-one readings and advisory work — close, interpretive attention for a threshold you're actually standing at.",
    cta: "Work With Me",
  },
  {
    title: "Offerings",
    href: "/offerings",
    body: "Guides, frameworks, and forthcoming workshops — tools built for discernment, not for a dopamine hit.",
    cta: "Explore Offerings",
  },
];

export default function HomePage() {
  const featured = getFeaturedPosts(3);
  const offeringPreview = offerings.slice(0, 3);

  return (
    <>
      <Hero />

      {/* B. Positioning */}
      <Section tone="parchment">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="label">What this is</p>
          </Reveal>
          <Reveal delay={100}>
            <p className="text-h2 font-serif leading-[1.28] text-ink text-balance">
              Soul Blueprint is a place for spiritual inquiry with structure, language,
              and discernment &mdash; for people trying to make meaning out of change
              without being reduced to a slogan.
            </p>
            <p className="mt-8 max-w-2xl text-body text-charcoal">
              It bridges philosophy, astrology, human design, and shadow work with plain,
              grounded language. Not self-help. Not soft-focus wellness. A working
              practice for thinkers who are also seekers, and seekers who refuse to stop
              thinking.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* C. Three pathways */}
      <Section>
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-h2 text-ink">Three ways in.</h2>
          <p className="max-w-sm text-body text-taupe">
            However you arrived, there&rsquo;s a door. Start where the pull is.
          </p>
        </div>
        <div className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
          {pathways.map((p, i) => (
            <Reveal key={p.title} delay={i * 90} className="h-full">
              <Link
                href={p.href}
                className="group flex h-full flex-col justify-between gap-12 bg-bone p-8 transition-colors duration-300 hover:bg-parchment lg:p-10"
              >
                <div>
                  <span className="font-serif text-5xl text-gold/50">
                    0{i + 1}
                  </span>
                  <h3 className="mt-6 text-h3 text-ink transition-colors group-hover:text-fig">
                    {p.title}
                  </h3>
                  <p className="mt-4 text-body text-charcoal">{p.body}</p>
                </div>
                <span className="text-meta uppercase tracking-label text-taupe transition-colors group-hover:text-fig">
                  {p.cta} &rarr;
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Pull quote */}
      <Section tone="parchment" spacing="sm">
        <Quote cite="From the journal">
          A coping strategy that succeeds becomes a personality. That&rsquo;s not a
          failure. It&rsquo;s just what success does to a strategy.
        </Quote>
      </Section>

      {/* D. Featured writing */}
      <Section>
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label mb-4">From the Journal</p>
            <h2 className="text-h2 text-ink">Recent writing.</h2>
          </div>
          <Button href="/writing" variant="ghost">
            All essays &rarr;
          </Button>
        </div>

        {featured.length > 0 && (
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-16">
            <Reveal className="lg:row-span-2">
              <EditorialCard post={featured[0]} variant="feature" />
            </Reveal>
            {featured.slice(1).map((post, i) => (
              <Reveal key={post.slug} delay={(i + 1) * 90}>
                <EditorialCard post={post} />
              </Reveal>
            ))}
          </div>
        )}
      </Section>

      {/* E. Founder */}
      <Section tone="ink">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
          <Reveal>
            {/* Portrait placeholder — replace with a real image */}
            <div className="flex aspect-[4/5] w-full items-center justify-center border border-bone/15 bg-charcoal/30">
              <span className="font-serif text-7xl italic text-bone/20">SM</span>
            </div>
          </Reveal>
          <Reveal delay={120} className="flex flex-col justify-center">
            <p className="label text-gold">The founder</p>
            <h2 className="mt-5 text-h1 text-bone text-balance">
              Shayly McDonnell &mdash; writer, archival researcher, and the person reading
              the chart.
            </h2>
            <p className="mt-6 max-w-xl text-lede text-bone/70">
              I work at the seam where spiritual language meets psychological reality. The
              point isn&rsquo;t to bypass anything &mdash; it&rsquo;s to look more
              precisely, and to give people accurate words for what they&rsquo;re actually
              living through.
            </p>
            <div className="mt-9">
              <Button
                href="/about"
                variant="secondary"
                className="border-bone/30 text-bone hover:border-bone hover:bg-bone hover:text-ink"
              >
                More about the work
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* F. Offerings preview */}
      <Section tone="parchment">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label mb-4">Offerings</p>
            <h2 className="text-h2 text-ink">Tools and private work.</h2>
          </div>
          <Button href="/offerings" variant="ghost">
            See everything &rarr;
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {offeringPreview.map((offering, i) => (
            <Reveal key={offering.slug} delay={i * 90} className="h-full">
              <OfferingCard offering={offering} />
            </Reveal>
          ))}
        </div>
      </Section>

      {/* G. Newsletter */}
      <NewsletterSection tone="bone" />
    </>
  );
}

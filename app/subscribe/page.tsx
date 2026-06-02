import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/Container";
import { NewsletterForm } from "@/components/Newsletter";
import { Pill } from "@/components/Pill";

export const metadata: Metadata = {
  title: "Subscribe",
  description:
    "The Soul Blueprint dispatch — essays, reflections, and frameworks for people who want depth and language for what they're living. Signal over noise.",
};

const receive = [
  {
    title: "Essays, early",
    body: "The longer pieces, often before they reach the journal — with the thinking that didn't make the final cut.",
  },
  {
    title: "Frameworks & prompts",
    body: "Working tools for discernment and reflection. Things to actually use, not just nod along to.",
  },
  {
    title: "Dispatches",
    body: "Shorter notes from the middle of the work — what I'm reading, watching, and turning over.",
  },
];

// Sample issue cards — placeholder archive preview.
const sampleIssues = [
  {
    no: "No. 14",
    title: "On the difference between rest and avoidance",
    teaser: "Both look like stillness. Only one restores you. A short field guide to telling them apart.",
  },
  {
    no: "No. 13",
    title: "The myth of the clean break",
    teaser: "Why the dramatic ending you're fantasizing about rarely delivers what you're actually after.",
  },
  {
    no: "No. 12",
    title: "What your calendar believes about you",
    teaser: "How we encode our real priorities in time, and what to do when the encoding has gone wrong.",
  },
];

export default function SubscribePage() {
  return (
    <>
      {/* Invitation hero */}
      <Section tone="ink" className="pt-44 sm:pt-48">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <p className="label text-gold">The Dispatch</p>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-display text-bone text-balance">
              A space for people who want depth and language for what they&rsquo;re living.
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <p className="mx-auto mt-6 max-w-xl text-lede text-bone/70">
              Signal over noise. Essays, reflections, frameworks, and dispatches &mdash;
              sent when there&rsquo;s something worth saying, and never to fill a calendar.
            </p>
          </Reveal>
          <Reveal
            delay={220}
            className="mx-auto mt-12 max-w-xl [&_label]:text-bone/60 [&_input]:border-bone/25 [&_input]:text-bone [&_p]:text-bone/50"
          >
            <NewsletterForm />
          </Reveal>
        </div>
      </Section>

      {/* What you receive */}
      <Section>
        <Reveal>
          <p className="label mb-4">What lands in your inbox</p>
          <h2 className="max-w-2xl text-h2 text-ink text-balance">
            Three kinds of writing, none of them filler.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {receive.map((r, i) => (
            <Reveal key={r.title} delay={i * 90}>
              <span className="font-serif text-4xl text-gold/50">0{i + 1}</span>
              <h3 className="mt-5 text-h3 text-ink">{r.title}</h3>
              <p className="mt-3 text-body text-charcoal">{r.body}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* The tone */}
      <Section tone="parchment" width="prose" spacing="sm">
        <Reveal>
          <p className="text-center font-serif text-[clamp(1.4rem,2.6vw,2rem)] leading-snug text-ink text-balance">
            It reads like a letter from someone who has thought about this more than is
            strictly reasonable, and who respects you too much to waste your attention.
          </p>
        </Reveal>
      </Section>

      {/* Sample issues */}
      <Section>
        <Reveal>
          <p className="label mb-4">From the archive</p>
          <h2 className="text-h2 text-ink">A few past issues.</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {sampleIssues.map((issue, i) => (
            <Reveal key={issue.no} delay={i * 80} className="h-full">
              <div className="flex h-full flex-col gap-4 border border-line bg-bone p-7">
                <Pill tone="outline">{issue.no}</Pill>
                <h3 className="font-serif text-h3 leading-snug text-ink">{issue.title}</h3>
                <p className="text-body text-charcoal">{issue.teaser}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Closing signup */}
      <Section tone="parchment">
        <Container width="narrow" className="text-center">
          <Reveal>
            <h2 className="text-h2 text-ink text-balance">Come in. Stay as long as it&rsquo;s useful.</h2>
            <p className="mt-4 text-body text-charcoal">
              No funnels, no urgency. Leave whenever it stops serving you &mdash;
              I&rsquo;d rather have your attention than your inertia.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-8">
            <NewsletterForm />
          </Reveal>
        </Container>
      </Section>
    </>
  );
}

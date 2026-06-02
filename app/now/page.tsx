import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { PageIntro } from "@/components/PageIntro";
import { formatDate } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Now",
  description:
    "What Shayly McDonnell is thinking about, reading, and working on at Soul Blueprint right now.",
};

// Edit this whenever the season changes. Kept deliberately simple.
const updated = "2026-05-20";

const sections = [
  {
    heading: "Working on",
    items: [
      "A long essay on the difference between a boundary and a wall — and why we keep confusing the two.",
      "The Discernment Framework: a working tool for telling intuition apart from anxiety. In edits.",
      "A small-group intensive on shadow work, built to be useful rather than theatrical.",
    ],
  },
  {
    heading: "Reading",
    items: [
      "Re-reading the parts of the canon I underlined too confidently the first time.",
      "Letters, mostly. The form teaches you how to think directly at one person.",
      "A stack of natal charts that have been quietly correcting my assumptions.",
    ],
  },
  {
    heading: "Turning over",
    items: [
      "Why the language of growth so often smuggles in the language of productivity.",
      "What it means to grieve a version of yourself that other people still expect.",
      "The gap between being understood and being agreed with.",
    ],
  },
];

export default function NowPage() {
  return (
    <>
      <PageIntro
        eyebrow="Now"
        title="What I'm thinking about, currently."
        lede="A living page rather than a finished one — the present tense of the work, updated as the season turns."
      />

      <Section width="prose">
        <Reveal>
          <p className="label mb-12">Last updated {formatDate(updated)}</p>
        </Reveal>
        <div className="space-y-16">
          {sections.map((section, i) => (
            <Reveal key={section.heading} delay={i * 80}>
              <h2 className="text-h2 text-ink">{section.heading}</h2>
              <ul className="mt-6 space-y-4">
                {section.items.map((item) => (
                  <li key={item} className="flex gap-4 text-read text-charcoal">
                    <span aria-hidden className="mt-4 h-px w-5 shrink-0 bg-gold" />
                    <span className="font-serif">{item}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120}>
          <p className="mt-16 border-t border-line pt-8 font-serif text-base italic text-taupe">
            Inspired by the &ldquo;now page&rdquo; convention &mdash; a snapshot of the
            present, kept honest by being temporary.
          </p>
        </Reveal>
      </Section>
    </>
  );
}

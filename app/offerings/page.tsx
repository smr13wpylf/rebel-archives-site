import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { PageIntro } from "@/components/PageIntro";
import { OfferingCard } from "@/components/OfferingCard";
import { CTABlock } from "@/components/CTABlock";
import { offerings } from "@/lib/offerings";

export const metadata: Metadata = {
  title: "Offerings",
  description:
    "Guides, frameworks, readings, and forthcoming workshops from Soul Blueprint — interpretive tools built for discernment, not for a dopamine hit.",
};

// Group offerings by kind for an organized, expandable layout.
const groups: { heading: string; blurb: string; kinds: string[] }[] = [
  {
    heading: "Readings & Sessions",
    blurb: "One-on-one interpretive work, recorded and translated into plain language.",
    kinds: ["Session"],
  },
  {
    heading: "Guides & Frameworks",
    blurb: "Self-paced tools and downloadable working documents for the questions that recur.",
    kinds: ["Guide", "Framework"],
  },
  {
    heading: "Workshops & Intensives",
    blurb: "Small-group work, gathered occasionally around a single, worthwhile subject.",
    kinds: ["Workshop"],
  },
];

export default function OfferingsPage() {
  return (
    <>
      <PageIntro
        eyebrow="Offerings"
        title="Tools for thinking, and work you can hold."
        lede="Essays, frameworks, and private work for those rebuilding identity from the inside out — gathered in one place, easy to return to."
      />

      {groups.map((group, gi) => {
        const items = offerings.filter((o) => group.kinds.includes(o.kind));
        if (items.length === 0) return null;
        return (
          <Section key={group.heading} tone={gi % 2 === 0 ? "bone" : "parchment"}>
            <Reveal>
              <div className="mb-12 max-w-2xl">
                <h2 className="text-h2 text-ink">{group.heading}</h2>
                <p className="mt-4 text-body text-charcoal">{group.blurb}</p>
              </div>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((offering, i) => (
                <Reveal key={offering.slug} delay={i * 80} className="h-full">
                  <OfferingCard offering={offering} />
                </Reveal>
              ))}
            </div>
          </Section>
        );
      })}

      <CTABlock
        eyebrow="Not sure where to start?"
        title="When in doubt, begin with a conversation."
        body="If nothing here fits exactly, that's often the sign for private work. Tell me what you're sitting with and we'll find the right shape."
        primary={{ label: "Work With Me", href: "/work-with-me" }}
        secondary={{ label: "Subscribe", href: "/subscribe" }}
      />
    </>
  );
}

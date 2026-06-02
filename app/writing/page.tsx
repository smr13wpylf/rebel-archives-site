import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { PageIntro } from "@/components/PageIntro";
import { EditorialCard } from "@/components/EditorialCard";
import { JournalArchive } from "@/components/JournalArchive";
import { NewsletterSection } from "@/components/NewsletterSection";
import { getAllPostMeta, getCategories } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays, cultural analysis, and dispatches on identity, transformation, shadow work, and meaning — from Soul Blueprint and Shayly McDonnell.",
};

export default function WritingPage() {
  const posts = getAllPostMeta();
  const categories = getCategories();
  const [lead, ...rest] = posts;

  return (
    <>
      <PageIntro
        eyebrow="The Journal"
        title="Essays, analysis, and dispatches."
        lede="Writing for people rebuilding identity from the inside out — depth without platitudes, language without perfume."
      />

      {/* Featured / lead post */}
      {lead && (
        <Section spacing="sm">
          <Reveal>
            <p className="label mb-8">Latest</p>
            <EditorialCard post={lead} variant="feature" />
          </Reveal>
        </Section>
      )}

      {/* Archive with filtering */}
      <Section tone="parchment">
        <JournalArchive posts={rest.length > 0 ? rest : posts} categories={categories} />
      </Section>

      <NewsletterSection tone="bone" />
    </>
  );
}

import type { Metadata } from "next";
import { Section } from "@/components/Section";
import { Reveal } from "@/components/Reveal";
import { PageIntro } from "@/components/PageIntro";
import { Quote } from "@/components/Quote";
import { CTABlock } from "@/components/CTABlock";

export const metadata: Metadata = {
  title: "About",
  description:
    "Soul Blueprint is the work of writer and archival researcher Shayly McDonnell — bridging spiritual inquiry, psychological insight, and cultural analysis for people in transition.",
};

const bridges = [
  {
    title: "Writing",
    body: "Essays and analysis that take ideas seriously and people more seriously — the public half of the work.",
  },
  {
    title: "Inquiry",
    body: "Real questions, held long enough to change shape, rather than answers handed over too quickly to be true.",
  },
  {
    title: "Symbolism",
    body: "Astrology and human design read as structured languages — useful maps, never deterministic verdicts.",
  },
  {
    title: "Depth",
    body: "Psychological grounding so the spiritual material stays honest, and the shadow stays in the room.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageIntro
        eyebrow="About"
        title="A studio for people rebuilding meaning in real time."
        lede="Soul Blueprint is the work of Shayly McDonnell — writer, archival researcher, and reader of the systems we use to understand ourselves."
      />

      {/* Founder bio + portrait */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
          <Reveal>
            <div className="sticky top-28">
              {/* Portrait placeholder — replace with a real image of Shay */}
              <div className="flex aspect-[4/5] w-full items-center justify-center border border-line bg-stone/50">
                <span className="font-serif text-7xl italic text-taupe/40">SM</span>
              </div>
              <p className="mt-4 text-meta text-taupe">
                Shayly McDonnell, founder of Soul Blueprint.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="prose-editorial max-w-prose">
              <p>
                I came to this work the long way &mdash; through archives, through grief,
                through a decade of being the person other people brought their hardest
                questions to before either of us had the language for them.
              </p>
              <p>
                My training is in research: finding the document that complicates the
                tidy story, sitting with primary sources until the real pattern surfaces.
                I read charts and designs the same way I read an archive &mdash; as
                structured evidence, not prophecy. The aim is never to tell you who you
                are. It&rsquo;s to give you a more accurate map of the terrain
                you&rsquo;re already standing on.
              </p>
              <p>
                Somewhere along the way I got tired of two things at once: spiritual
                spaces that couldn&rsquo;t tolerate a hard question, and intellectual
                spaces that treated meaning as embarrassing. Soul Blueprint is what I
                built in the gap &mdash; a place where you can be rigorous and reverent in
                the same breath.
              </p>
              <h2>Why this exists</h2>
              <p>
                Most of the available language for transformation is either too soft to be
                useful or too clinical to be true. &ldquo;Manifest your dream life&rdquo;
                on one side; a diagnosis on the other. Neither helps much when
                you&rsquo;re standing in the wreckage of a self that stopped working and
                you don&rsquo;t yet know what comes next.
              </p>
              <p>
                I think people in transition deserve better company than that. Not a
                cheerleader, not a clinician &mdash; a discerning second mind. Someone who
                can hold the symbolic and the psychological at once, who won&rsquo;t
                flatten your situation into a slogan or pathologize it into a problem.
              </p>
              <h2>What this work is not</h2>
              <p>
                It isn&rsquo;t therapy, and it doesn&rsquo;t pretend to be. It isn&rsquo;t
                coaching toward a goal you&rsquo;ve been told to want. It isn&rsquo;t a
                promise that the right ritual will dissolve your difficulty. It&rsquo;s
                slower, plainer, and more honest than that &mdash; closer to a long
                conversation with someone who has read widely, listened carefully, and
                refuses to lie to you to make you feel better.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* What the work bridges */}
      <Section tone="parchment">
        <Reveal>
          <p className="label mb-4">What the work bridges</p>
          <h2 className="max-w-2xl text-h2 text-ink text-balance">
            Four languages, read together rather than kept in separate rooms.
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
          {bridges.map((b, i) => (
            <Reveal key={b.title} delay={i * 80} className="h-full">
              <div className="h-full bg-parchment p-8 lg:p-10">
                <h3 className="text-h3 text-ink">{b.title}</h3>
                <p className="mt-3 text-body text-charcoal">{b.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* Manifesto quote */}
      <Section spacing="sm">
        <Quote cite="The working principle">
          Be rigorous and reverent in the same breath. Anything less sells one half of you
          short.
        </Quote>
      </Section>

      {/* Who this is for */}
      <Section tone="parchment">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <Reveal>
            <p className="label">Who this is for</p>
          </Reveal>
          <Reveal delay={100}>
            <div className="max-w-2xl">
              <p className="text-lede text-ink">
                For thoughtful, introspective people in some kind of threshold &mdash;
                rupture, reinvention, grief, burnout, creative emergence, or the slow
                disassembly of a self that used to fit.
              </p>
              <p className="mt-6 text-body text-charcoal">
                You&rsquo;re intelligent, you can handle nuance, and you&rsquo;re tired of
                being patronized. You want language that feels lived rather than optimized.
                You value intuition <em>and</em> discernment, and you&rsquo;ve never quite
                found a space that respected both. If any of that lands, you&rsquo;re in
                the right room.
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      <CTABlock
        eyebrow="Where to next"
        title="Read the writing, or bring a question."
        body="Start with the journal to hear how I think, or reach out about private work when you're ready for something closer."
        primary={{ label: "Read the Journal", href: "/writing" }}
        secondary={{ label: "Work With Me", href: "/work-with-me" }}
      />
    </>
  );
}
